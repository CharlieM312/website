/// <reference types="jest" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { TrackerComponent } from './tracker.component';

describe('TrackerComponent', () => {
    let component: TrackerComponent;
    let fixture: ComponentFixture<TrackerComponent>;
    let fetchMock: jest.Mock;

    beforeEach(async () => {
        localStorage.clear();
        fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue([])
        });
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        await TestBed.configureTestingModule({
            declarations: [TrackerComponent],
            imports: [FormsModule],
            providers: [DarkModeService, CookieService]
        }).compileComponents();

        fixture = TestBed.createComponent(TrackerComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should enable dark mode and restore saved session on init', () => {
        const cookieService = TestBed.inject(CookieService);
        const darkModeService = TestBed.inject(DarkModeService);
        jest.spyOn(cookieService, 'get').mockReturnValue('true');
        const enableSpy = jest.spyOn(darkModeService, 'enableDarkMode');
        localStorage.setItem('tracker_session_token', 'saved-token-123');
        localStorage.setItem('tracker_username', 'CharlieM312');

        component.ngOnInit();

        expect(enableSpy).toHaveBeenCalled();
        expect(component.sessionToken).toBe('saved-token-123');
        expect(component.loggedInUser).toBe('CharlieM312');
        expect(component.isAuthenticated).toBe(true);
    });

    it('should authenticate user via POST /api/login with optional totp_code and store session token', async () => {
        component.loginUsername = 'CharlieM312';
        component.loginPassword = 'secret-password';
        component.totpCode = '123456';

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue({
                success: true,
                token: 'uuid-session-token',
                username: 'CharlieM312'
            })
        });

        await component.onLogin();

        expect(fetchMock).toHaveBeenCalledWith('/api/login', {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json'
            },
            body: JSON.stringify({
                username: 'CharlieM312',
                password: 'secret-password',
                ['totp_code']: '123456'
            })
        });
        expect(component.isAuthenticated).toBe(true);
        expect(component.sessionToken).toBe('uuid-session-token');
        expect(component.loggedInUser).toBe('CharlieM312');
        expect(component.loginPassword).toBe('');
        expect(component.totpCode).toBe('');
        expect(localStorage.getItem('tracker_session_token')).toBe('uuid-session-token');
    });

    it('should set authError when login fails', async () => {
        component.loginUsername = 'CharlieM312';
        component.loginPassword = 'wrong-password';

        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 401,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue({
                error: 'Invalid username or password'
            })
        });

        await component.onLogin();

        expect(component.isAuthenticated).toBe(false);
        expect(component.authError).toBe('Invalid username or password');
    });

    it('should authenticate via YubiKey WebAuthn flow', async () => {
        component.loginUsername = 'CharlieM312';
        const getMock = jest.fn().mockResolvedValue({
            id: 'cred-123',
            response: {
                authenticatorData: new Uint8Array([1, 2, 3]).buffer,
                clientDataJSON: new Uint8Array([4, 5, 6]).buffer,
                signature: new Uint8Array([7, 8, 9]).buffer
            }
        });
        Object.defineProperty(navigator, 'credentials', {
            value: { get: getMock, create: jest.fn() },
            configurable: true
        });

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: { get: jest.fn().mockReturnValue(null) },
                json: jest.fn().mockResolvedValue({
                    challenge: 'Y2hhbGxlbmdl',
                    rpId: 'localhost',
                    allowCredentials: [{ id: 'Y3JlZC0xMjM', type: 'public-key' }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: { get: jest.fn().mockReturnValue(null) },
                json: jest.fn().mockResolvedValue({
                    success: true,
                    token: 'yubikey-session-token',
                    username: 'CharlieM312'
                })
            });

        await component.onYubiKeyLogin();

        expect(getMock).toHaveBeenCalled();
        expect(component.sessionToken).toBe('yubikey-session-token');
        expect(component.loggedInUser).toBe('CharlieM312');
    });

    it('should setup TOTP secret via POST /api/2fa/totp/setup', async () => {
        component.sessionToken = 'uuid-session-token';
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                secret: 'JBSWY3DPEHPK3PXP',
                ['otpauth_url']: 'otpauth://totp/AirportTracker:CharlieM312?secret=JBSWY3DPEHPK3PXP'
            })
        });

        await component.setupTotp();

        expect(fetchMock).toHaveBeenCalledWith('/api/2fa/totp/setup', {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer uuid-session-token'
            }
        });
        expect(component.totpSetupSecret).toBe('JBSWY3DPEHPK3PXP');
        expect(component.totpSetupUri).toContain('otpauth://totp/');
        expect(component.totpQrDataUrl).toMatch(/^data:image\/png;base64,/);
        expect(component.totpPendingVerification).toBe(true);
    });

    it('should verify pending TOTP code via POST /api/2fa/totp/verify and enable TOTP', async () => {
        component.sessionToken = 'uuid-session-token';
        component.totpSetupSecret = 'JBSWY3DPEHPK3PXP';
        component.totpPendingVerification = true;
        component.totpVerifyCode = '654321';

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                ['totp_enabled']: true
            })
        });

        await component.verifyTotp();

        expect(fetchMock).toHaveBeenCalledWith('/api/2fa/totp/verify', {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer uuid-session-token'
            },
            body: JSON.stringify({ code: '654321' })
        });
        expect(component.totpEnabled).toBe(true);
        expect(component.totpPendingVerification).toBe(false);
        expect(component.totpSetupSecret).toBe('');
    });

    it('should load 2FA status and passkeys via GET /api/2fa/status and delete individual or all passkeys', async () => {
        component.sessionToken = 'uuid-session-token';

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                username: 'CharlieM312',
                ['totp_enabled']: true,
                ['webauthn_enabled']: true,
                ['passkey_count']: 2,
                passkeys: [
                    {
                        id: 1,
                        ['credential_id']: 'cred-1',
                        label: 'YubiKey 5C',
                        ['created_at']: '2026-11-15 22:30:00'
                    },
                    {
                        id: 2,
                        ['credential_id']: 'cred-2',
                        label: 'Backup Key',
                        ['created_at']: '2026-11-15 22:35:00'
                    }
                ]
            })
        });

        await component.loadTwoFaStatus();

        expect(component.totpEnabled).toBe(true);
        expect(component.webauthnEnabled).toBe(true);
        expect(component.passkeys).toEqual([
            {
                id: 1,
                credentialId: 'cred-1',
                label: 'YubiKey 5C',
                createdAt: '2026-11-15 22:30:00'
            },
            {
                id: 2,
                credentialId: 'cred-2',
                label: 'Backup Key',
                createdAt: '2026-11-15 22:35:00'
            }
        ]);

        await component.deletePasskey('cred-1');
        expect(fetchMock).toHaveBeenCalledWith('/api/webauthn?credential_id=cred-1', {
            method: 'DELETE',
            headers: {
                ['Authorization']: 'Bearer uuid-session-token'
            }
        });
        expect(component.passkeys).toHaveLength(1);
        expect(component.passkeys[0].credentialId).toBe('cred-2');
        expect(component.webauthnEnabled).toBe(true);

        jest.spyOn(window, 'prompt').mockReturnValue('YubiKey 5 NFC');
        await component.renamePasskey('cred-2');
        expect(fetchMock).toHaveBeenCalledWith('/api/webauthn/edit-options', {
            method: 'PATCH',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer uuid-session-token'
            },
            body: JSON.stringify({
                ['credential_id']: 'cred-2',
                label: 'YubiKey 5 NFC'
            })
        });
        expect(component.passkeys[0].label).toBe('YubiKey 5 NFC');

        await component.disableTotp();
        expect(fetchMock).toHaveBeenCalledWith('/api/2fa/totp', {
            method: 'DELETE',
            headers: {
                ['Authorization']: 'Bearer uuid-session-token'
            }
        });
        expect(component.totpEnabled).toBe(false);

        await component.disableWebAuthn();
        expect(fetchMock).toHaveBeenCalledWith('/api/webauthn', {
            method: 'DELETE',
            headers: {
                ['Authorization']: 'Bearer uuid-session-token'
            }
        });
        expect(component.webauthnEnabled).toBe(false);
        expect(component.passkeys).toEqual([]);
    });

    it('should register a passkey with an optional label via POST /api/webauthn/register-verify', async () => {
        component.sessionToken = 'uuid-session-token';
        component.loggedInUser = 'CharlieM312';
        component.passkeyLabel = 'My YubiKey 5C';

        const createMock = jest.fn().mockResolvedValue({
            id: 'new-cred-id',
            response: {
                getPublicKey: () => new Uint8Array([10, 20, 30]).buffer
            }
        });
        Object.defineProperty(navigator, 'credentials', {
            value: { get: jest.fn(), create: createMock },
            configurable: true
        });

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: { get: jest.fn().mockReturnValue(null) },
                json: jest.fn().mockResolvedValue({
                    challenge: 'Y2hhbGxlbmdl',
                    rpId: 'localhost',
                    excludeCredentials: [{ id: 'Y3JlZC0x', type: 'public-key' }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: { get: jest.fn().mockReturnValue(null) },
                json: jest.fn().mockResolvedValue({
                    success: true,
                    ['passkey_count']: 1
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: { get: jest.fn().mockReturnValue(null) },
                json: jest.fn().mockResolvedValue({
                    username: 'CharlieM312',
                    ['totp_enabled']: false,
                    ['webauthn_enabled']: true,
                    passkeys: [
                        {
                            id: 1,
                            ['credential_id']: 'new-cred-id',
                            label: 'My YubiKey 5C',
                            ['created_at']: '2026-11-15 22:40:00'
                        }
                    ]
                })
            });

        await component.registerYubiKey();

        expect(createMock).toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledWith('/api/webauthn/register-verify', {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer uuid-session-token'
            },
            body: JSON.stringify({
                ['credential_id']: 'new-cred-id',
                ['public_key']: 'ChQe',
                label: 'My YubiKey 5C'
            })
        });
        expect(component.passkeyLabel).toBe('');
        expect(component.passkeys).toHaveLength(1);
        expect(component.passkeys[0].label).toBe('My YubiKey 5C');
    });

    it('should submit an account request via POST /api/register and show pendingApprovalMessage', async () => {
        component.loginUsername = 'new_traveler';
        component.loginPassword = 'password123';

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 202,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                ['pending_approval']: true,
                status: 'pending',
                username: 'new_traveler',
                message: 'Account request submitted. An administrator must approve your account before you can sign in.'
            })
        });

        await component.onRequestAccount();

        expect(fetchMock).toHaveBeenCalledWith('/api/register', {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json'
            },
            body: JSON.stringify({
                username: 'new_traveler',
                password: 'password123'
            })
        });
        expect(component.pendingApprovalMessage).toContain('approve');
    });

    it('should handle OAuth sign-in and linking/unlinking via /api/oauth/login and /api/oauth/link', async () => {
        component.loginUsername = 'CharlieM312';

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                state: 'csrf-state-0',
                providers: {
                    github: { enabled: true, ['client_id']: null }
                }
            })
        });
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                token: 'oauth-token-123',
                username: 'CharlieM312',
                ['is_admin']: true,
                status: 'approved'
            })
        });

        await component.onOAuthLogin('github');

        expect(fetchMock).toHaveBeenCalledWith('/api/oauth/login', {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json'
            },
            body: JSON.stringify({
                provider: 'github',
                ['provider_user_id']: 'CharlieM312',
                username: 'CharlieM312',
                ['display_name']: 'CharlieM312'
            })
        });
        expect(component.sessionToken).toBe('oauth-token-123');
        expect(component.isAdmin).toBe(true);

        jest.spyOn(window, 'prompt').mockReturnValue('charlie@github.com');
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                state: 'csrf-state-1',
                providers: {
                    github: { enabled: true, ['client_id']: null }
                }
            })
        });
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                ['oauth_accounts']: [
                    {
                        id: 1,
                        provider: 'github',
                        ['provider_user_id']: 'charlie@github.com',
                        ['display_name']: 'charlie@github.com',
                        ['created_at']: '2026-11-16'
                    }
                ]
            })
        });

        await component.linkOAuthProvider('github');
        expect(component.oauthAccounts).toHaveLength(1);
        expect(component.isOAuthProviderLinked('github')).toBe(true);

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                ['oauth_accounts']: []
            })
        });

        await component.unlinkOAuthProvider('github');
        expect(component.oauthAccounts).toHaveLength(0);

        component.sessionToken = '';
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                token: 'github-callback-token',
                username: 'CharlieM312',
                ['is_admin']: true,
                status: 'approved'
            })
        });

        await component.handleOAuthCallback('?code=gh-auth-code&state=csrf-state-1');
        expect(component.sessionToken).toBe('github-callback-token');

        component.sessionToken = '';
        localStorage.setItem('tracker_oauth_provider', 'microsoft');
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                token: 'microsoft-callback-token',
                username: 'CharlieM312',
                ['is_admin']: true,
                status: 'approved'
            })
        });

        await component.handleOAuthCallback('?code=ms-auth-code&state=csrf-state-2');
        expect(component.sessionToken).toBe('microsoft-callback-token');
    });

    it('should load, approve/reject, and delete users via /api/admin/users when admin', async () => {
        component.sessionToken = 'admin-token';
        component.loggedInUser = 'CharlieM312';
        component.isAdmin = true;

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                ['pending_count']: 1,
                ['total_count']: 2,
                users: [
                    {
                        id: 2,
                        username: 'pending_user',
                        role: 'user',
                        status: 'pending',
                        ['oauth_accounts']: [{ id: 1, provider: 'google', ['provider_user_id']: 'g-1' }]
                    },
                    {
                        id: 1,
                        username: 'CharlieM312',
                        role: 'admin',
                        status: 'approved',
                        ['oauth_accounts']: []
                    }
                ]
            })
        });

        await component.loadAdminUsers();
        expect(component.pendingUserCount).toBe(1);
        expect(component.adminUsers).toHaveLength(2);

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                username: 'pending_user',
                status: 'approved',
                role: 'user'
            })
        });

        await component.updateUserStatus('pending_user', 'approved');
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/users/pending_user', {
            method: 'PATCH',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer admin-token'
            },
            body: JSON.stringify({ status: 'approved' })
        });
        expect(component.adminUsers[0].status).toBe('approved');
        expect(component.pendingUserCount).toBe(0);

        await component.deleteAdminUser('pending_user');
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/users/pending_user', {
            method: 'DELETE',
            headers: {
                ['Authorization']: 'Bearer admin-token'
            }
        });
        expect(component.adminUsers).toHaveLength(1);

        jest.spyOn(window, 'prompt').mockReturnValue('CharlieM');
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                ['old_username']: 'CharlieM312',
                username: 'CharlieM'
            })
        });

        await component.renameAdminUser('CharlieM312');
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/users/CharlieM312', {
            method: 'PATCH',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer admin-token'
            },
            body: JSON.stringify({ ['new_username']: 'CharlieM' })
        });
        expect(component.adminUsers[0].username).toBe('CharlieM');
        expect(component.loggedInUser).toBe('CharlieM');
    });

    it('should update own username via PATCH /api/user/username', async () => {
        component.sessionToken = 'uuid-session-token';
        component.loggedInUser = 'CharlieM312';
        component.newUsernameInput = 'CharlieM';

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue({
                success: true,
                ['old_username']: 'CharlieM312',
                username: 'CharlieM'
            })
        });

        await component.updateOwnUsername();

        expect(fetchMock).toHaveBeenCalledWith('/api/user/username', {
            method: 'PATCH',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer uuid-session-token'
            },
            body: JSON.stringify({ ['new_username']: 'CharlieM' })
        });
        expect(component.loggedInUser).toBe('CharlieM');
        expect(component.newUsernameInput).toBe('');
        expect(localStorage.getItem('tracker_username')).toBe('CharlieM');
    });

    it('should clear session and call POST /api/logout on onLogout', async () => {
        component.sessionToken = 'uuid-session-token';
        component.loggedInUser = 'CharlieM312';
        localStorage.setItem('tracker_session_token', 'uuid-session-token');

        await component.onLogout();

        expect(component.isAuthenticated).toBe(false);
        expect(component.sessionToken).toBe('');
        expect(component.loggedInUser).toBe('');
        expect(localStorage.getItem('tracker_session_token')).toBeNull();
        expect(fetchMock).toHaveBeenCalledWith('/api/logout', {
            method: 'POST',
            headers: {
                ['Authorization']: 'Bearer uuid-session-token'
            }
        });
    });

    it('should load and map visits with flight details and capture x-d1-bookmark', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: {
                get: jest.fn().mockReturnValue('bookmark-123')
            },
            json: jest.fn().mockResolvedValue([
                {
                    id: 1,
                    username: 'CharlieM312',
                    ['iata_code']: 'HAM',
                    ['origin_iata']: 'LHR',
                    ['flight_number']: 'BA968',
                    ['distance_km']: 745,
                    ['airport_name']: 'Hamburg Airport',
                    city: 'Hamburg',
                    country: 'Germany',
                    ['visit_date']: '2026-09-15',
                    notes: 'Morning flight'
                },
                {
                    ['iata_code']: 'LGW',
                    ['visit_date']: '2026-11-16'
                }
            ])
        });

        await component.loadVisits();

        expect(fetchMock).toHaveBeenCalledWith('/api/visits', undefined);
        expect(component.d1Bookmark).toBe('bookmark-123');
        expect(component.loading).toBe(false);
        expect(component.error).toBe('');
        expect(component.visits).toEqual([
            {
                id: 1,
                username: 'CharlieM312',
                iataCode: 'HAM',
                originIata: 'LHR',
                flightNumber: 'BA968',
                distanceKm: 745,
                airportName: 'Hamburg Airport',
                city: 'Hamburg',
                country: 'Germany',
                visitDate: '2026-09-15',
                notes: 'Morning flight'
            },
            {
                id: 0,
                username: 'Anonymous',
                iataCode: 'LGW',
                originIata: '',
                flightNumber: '',
                distanceKm: null,
                airportName: 'Unknown Airport',
                city: '',
                country: '',
                visitDate: '2026-11-16',
                notes: ''
            }
        ]);
    });

    it('should load travel stats from /api/stats', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue({
                ['total_visits']: 5,
                ['unique_airports']: 4,
                ['unique_countries']: 2,
                ['total_distance_km']: 1490,
                ['total_distance_miles']: 925.8
            })
        });

        await component.loadStats('CharlieM312');

        expect(fetchMock).toHaveBeenCalledWith('/api/stats?username=CharlieM312', undefined);
        expect(component.stats).toEqual({
            totalVisits: 5,
            uniqueAirports: 4,
            uniqueCountries: 2,
            totalDistanceKm: 1490,
            totalDistanceMiles: 925.8
        });
    });

    it('should set error message when loadVisits fails', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        await component.loadVisits();

        expect(component.loading).toBe(false);
        expect(component.error).toBe('Failed to load visits.');
    });

    it('should load visits for a specific username using filterUsername', async () => {
        component.filterUsername = 'CharlieM312';
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue([
                {
                    id: 2,
                    username: 'CharlieM312',
                    ['iata_code']: 'EDI',
                    ['airport_name']: 'Edinburgh',
                    ['visit_date']: '2026-10-01',
                    notes: ''
                }
            ])
        });

        await component.loadUserVisits();

        expect(fetchMock).toHaveBeenCalledWith('/api/visits?username=CharlieM312', undefined);
        expect(component.loading).toBe(false);
        expect(component.visits).toHaveLength(1);
        expect(component.visits[0].iataCode).toBe('EDI');
    });

    it('should fall back to loadVisits when filterUsername and loggedInUser are empty', async () => {
        component.filterUsername = '   ';
        component.loggedInUser = '';

        await component.loadUserVisits();

        expect(fetchMock).toHaveBeenCalledWith('/api/visits', undefined);
    });

    it('should set error message when loadUserVisits fails', async () => {
        component.filterUsername = 'CharlieM312';
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        await component.loadUserVisits();

        expect(component.loading).toBe(false);
        expect(component.error).toBe('Failed to load user visits.');
    });

    it('should clear filterUsername and reload all visits on clearUserFilter', async () => {
        component.filterUsername = 'CharlieM312';

        await component.clearUserFilter();

        expect(component.filterUsername).toBe('');
        expect(fetchMock).toHaveBeenCalledWith('/api/visits', undefined);
    });

    it('should submit a new visit using sessionToken and loggedInUser', async () => {
        component.sessionToken = 'uuid-session-token';
        component.loggedInUser = 'CharlieM312';
        component.originIata = 'lhr';
        component.iataCode = 'ham';
        component.flightNumber = 'ba968';
        component.airportName = 'Hamburg Airport';
        component.visitDate = '2026-09-15';
        component.notes = 'Test note';

        await component.onSubmit();

        expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/visits', {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer uuid-session-token'
            },
            body: JSON.stringify({
                username: 'CharlieM312',
                ['iata_code']: 'HAM',
                ['visit_date']: '2026-09-15',
                notes: 'Test note',
                ['origin_iata']: 'LHR',
                ['flight_number']: 'BA968',
                ['airport_name']: 'Hamburg Airport'
            })
        });
        expect(component.sessionToken).toBe('uuid-session-token');
        expect(component.originIata).toBe('');
        expect(component.iataCode).toBe('');
        expect(component.flightNumber).toBe('');
        expect(component.airportName).toBe('');
        expect(component.visitDate).toBe('');
        expect(component.notes).toBe('');
        expect(component.submitSuccess).toBe('Visit logged successfully.');
    });

    it('should send PATCH request when editing an existing visit', async () => {
        component.sessionToken = 'uuid-session-token';
        component.loggedInUser = 'CharlieM312';
        component.startEdit({
            id: 1,
            username: 'CharlieM312',
            iataCode: 'HAM',
            originIata: 'LHR',
            flightNumber: 'BA968',
            distanceKm: 745,
            airportName: 'Hamburg Airport',
            city: 'Hamburg',
            country: 'Germany',
            visitDate: '2026-09-15',
            notes: 'Updated note'
        });

        await component.onSubmit();

        expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/visits/1', {
            method: 'PATCH',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer uuid-session-token'
            },
            body: JSON.stringify({
                username: 'CharlieM312',
                ['iata_code']: 'HAM',
                ['visit_date']: '2026-09-15',
                notes: 'Updated note',
                ['origin_iata']: 'LHR',
                ['flight_number']: 'BA968',
                ['airport_name']: 'Hamburg Airport'
            })
        });
        expect(component.editingVisitId).toBeNull();
        expect(component.submitSuccess).toBe('Visit updated successfully.');
    });

    it('should display API error message when onSubmit fails with 400', async () => {
        component.sessionToken = 'uuid-session-token';
        component.loggedInUser = 'CharlieM312';
        component.iataCode = 'XYZ';
        component.visitDate = '2026-11-15';

        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 400,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue({
                error: 'Invalid or unknown iata_code \'XYZ\'. It must match an airport in /api/airports.'
            })
        });

        await component.onSubmit();

        expect(component.submitError).toBe(
            'Invalid or unknown iata_code \'XYZ\'. It must match an airport in /api/airports.'
        );
        expect(component.isAuthenticated).toBe(true);
    });

    it('should delete a visit by id when authenticated', async () => {
        component.sessionToken = 'uuid-session-token';
        component.loggedInUser = 'CharlieM312';
        component.visits = [
            {
                id: 1,
                username: 'CharlieM312',
                iataCode: 'HAM',
                originIata: 'LHR',
                flightNumber: 'BA968',
                distanceKm: 745,
                airportName: 'Hamburg Airport',
                city: 'Hamburg',
                country: 'Germany',
                visitDate: '2026-09-15',
                notes: ''
            }
        ];

        await component.deleteVisit(1);

        expect(fetchMock).toHaveBeenCalledWith('/api/visits/1', {
            method: 'DELETE',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer uuid-session-token'
            },
            body: JSON.stringify({ id: 1 })
        });
        expect(component.visits).toHaveLength(0);
        expect(component.submitSuccess).toBe('Visit deleted.');
    });
});
