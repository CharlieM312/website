import { ChangeDetectorRef, Component } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';
import { generateQrCodeDataUrl } from './qr-code.util';

export interface VisitItem {
    id: number;
    username: string;
    iataCode: string;
    originIata: string;
    flightNumber: string;
    distanceKm: number | null;
    airportName: string;
    city: string;
    country: string;
    visitDate: string;
    notes: string;
}

export interface MostVisitedAirport {
    iataCode: string;
    airportName: string;
    city: string;
    country: string;
    visitCount: number;
}

export interface CountryVisitedStat {
    country: string;
    visitCount: number;
    uniqueAirports: number;
}

export interface YearVisitStat {
    year: string;
    visitCount: number;
    uniqueAirports: number;
}

export interface PasskeyItem {
    id: number;
    credentialId: string;
    label: string;
    createdAt: string;
}

export interface TravelStats {
    totalVisits: number;
    uniqueAirports: number;
    uniqueCountries: number;
    totalDistanceKm: number;
    totalDistanceMiles: number;
    firstVisitDate?: string;
    lastVisitDate?: string;
    mostVisitedAirports?: MostVisitedAirport[];
    countriesVisited?: CountryVisitedStat[];
    visitsByYear?: YearVisitStat[];
}

@Component({
    selector: 'app-tracker',
    templateUrl: './tracker.component.html',
    styleUrl: './tracker.component.scss',
    standalone: false
})
export class TrackerComponent implements OnInit, OnDestroy {
    private readonly apiUrl = '/api/visits';
    private readonly statsUrl = '/api/stats';
    private readonly loginUrl = '/api/login';
    private readonly logoutUrl = '/api/logout';
    private readonly twoFaStatusUrl = '/api/2fa/status';
    private readonly totpSetupUrl = '/api/2fa/totp/setup';
    private readonly totpVerifyUrl = '/api/2fa/totp/verify';
    private readonly totpDisableUrl = '/api/2fa/totp';
    private readonly webauthnDisableUrl = '/api/webauthn';
    private readonly webauthnEditOptionsUrl = '/api/webauthn/edit-options';
    private readonly webauthnRegisterOptionsUrl = '/api/webauthn/register-options';
    private readonly webauthnRegisterVerifyUrl = '/api/webauthn/register-verify';
    private readonly webauthnLoginOptionsUrl = '/api/webauthn/login-options';
    private readonly webauthnLoginVerifyUrl = '/api/webauthn/login-verify';
    private readonly tokenStorageKey = 'tracker_session_token';
    private readonly userStorageKey = 'tracker_username';
    private subscriber = new Subscription();

    loginUsername = '';
    loginPassword = '';
    totpCode = '';
    sessionToken = '';
    loggedInUser = '';

    showSecuritySettings = false;
    totpEnabled = false;
    webauthnEnabled = false;
    passkeys: PasskeyItem[] = [];
    passkeyLabel = '';
    totpPendingVerification = false;
    totpVerifyCode = '';
    totpSetupSecret = '';
    totpSetupUri = '';
    totpQrDataUrl = '';
    securityMessage = '';
    securityError = '';

    filterUsername = '';
    originIata = '';
    iataCode = '';
    flightNumber = '';
    airportName = '';
    visitDate = '';
    notes = '';

    editingVisitId: number | null = null;
    d1Bookmark = '';

    visits: VisitItem[] = [];
    stats: TravelStats | null = null;
    loading = true;
    authenticating = false;
    submitting = false;
    error = '';
    authError = '';
    submitError = '';
    submitSuccess = '';

    constructor(
        private darkModeService: DarkModeService,
        private cookieService: CookieService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        if (this.cookieService.get('darkMode') === 'true') {
            this.darkModeService.enableDarkMode();
        }

        if (typeof localStorage !== 'undefined') {
            this.sessionToken = localStorage.getItem(this.tokenStorageKey) || '';
            this.loggedInUser = localStorage.getItem(this.userStorageKey) || '';
        }

        this.subscriber.add(
            this.darkModeService.darkMode$.subscribe(enabled => {
                const content = typeof document !== 'undefined' ? document.querySelector('.content') : null;

                if (enabled) {
                    document.body.classList.add('dark-mode');
                    if (content) content.classList.add('dark-mode');
                    this.cookieService.set('darkMode', 'true');
                } else {
                    document.body.classList.remove('dark-mode');
                    if (content) content.classList.remove('dark-mode');
                    this.cookieService.set('darkMode', 'false');
                }
            })
        );

        void this.loadVisits();
        void this.loadStats();
    }

    ngOnDestroy(): void {
        this.subscriber.unsubscribe();
    }

    get isAuthenticated(): boolean {
        return Boolean(this.sessionToken);
    }

    private getRequestHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
        const headers: Record<string, string> = { ...extraHeaders };
        if (this.d1Bookmark) {
            headers['x-d1-bookmark'] = this.d1Bookmark;
        }
        return headers;
    }

    private captureBookmark(res: Response): void {
        const bookmark = res.headers?.get?.('x-d1-bookmark');
        if (bookmark) {
            this.d1Bookmark = bookmark;
        }
    }

    private saveSession(token: string, username: string): void {
        this.sessionToken = token;
        this.loggedInUser = username;
        this.loginPassword = '';
        this.loginUsername = '';
        this.totpCode = '';

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.tokenStorageKey, this.sessionToken);
            localStorage.setItem(this.userStorageKey, this.loggedInUser);
        }
    }

    private clearSession(): void {
        this.sessionToken = '';
        this.loggedInUser = '';
        this.editingVisitId = null;
        this.showSecuritySettings = false;
        this.totpEnabled = false;
        this.webauthnEnabled = false;
        this.passkeys = [];
        this.passkeyLabel = '';
        this.totpPendingVerification = false;
        this.totpVerifyCode = '';
        this.totpSetupSecret = '';
        this.totpSetupUri = '';
        this.totpQrDataUrl = '';
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.tokenStorageKey);
            localStorage.removeItem(this.userStorageKey);
        }
    }

    private bufferToBase64Url(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    private base64UrlToUint8Array(base64Url: string): Uint8Array {
        const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
        const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        const output = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
            output[i] = raw.charCodeAt(i);
        }
        return output;
    }

    async onLogin(): Promise<void> {
        const trimmedUser = this.loginUsername.trim();
        if (!trimmedUser || !this.loginPassword) {
            this.authError = 'Please enter both username and password.';
            this.cdr.detectChanges();
            return;
        }

        this.authenticating = true;
        this.authError = '';
        this.submitError = '';
        this.submitSuccess = '';

        const payload: Record<string, string> = {
            username: trimmedUser,
            password: this.loginPassword
        };
        if (this.totpCode.trim()) {
            payload['totp_code'] = this.totpCode.trim();
        }

        try {
            const res = await fetch(this.loginUrl, {
                method: 'POST',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json'
                }),
                body: JSON.stringify(payload)
            });

            this.captureBookmark(res);
            const body = (await res.json()) as Record<string, unknown>;

            if (res.ok && typeof body['token'] === 'string') {
                const resolvedUser =
                    typeof body['username'] === 'string' && body['username']
                        ? body['username']
                        : trimmedUser;
                this.saveSession(body['token'], resolvedUser);
            } else {
                this.authError =
                    typeof body['error'] === 'string' && body['error']
                        ? body['error']
                        : 'Invalid credentials or 2FA code.';
            }
        } catch {
            this.authError = 'Network error: Unable to sign in.';
        } finally {
            this.authenticating = false;
            this.cdr.detectChanges();
        }
    }

    async onYubiKeyLogin(): Promise<void> {
        const trimmedUser = this.loginUsername.trim();
        if (!trimmedUser) {
            this.authError = 'Enter your username first, then click Sign In with YubiKey.';
            this.cdr.detectChanges();
            return;
        }

        if (typeof navigator === 'undefined' || !navigator.credentials) {
            this.authError = 'WebAuthn security keys are not supported in this browser.';
            this.cdr.detectChanges();
            return;
        }

        this.authenticating = true;
        this.authError = '';

        try {
            const optionsRes = await fetch(this.webauthnLoginOptionsUrl, {
                method: 'POST',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json'
                }),
                body: JSON.stringify({
                    username: trimmedUser,
                    password: this.loginPassword || undefined
                })
            });

            this.captureBookmark(optionsRes);
            const optionsBody = (await optionsRes.json()) as Record<string, unknown>;
            if (!optionsRes.ok || typeof optionsBody['challenge'] !== 'string') {
                this.authError =
                    typeof optionsBody['error'] === 'string'
                        ? optionsBody['error']
                        : 'Failed to start YubiKey challenge.';
                return;
            }

            const rawCredentials = Array.isArray(optionsBody['allowCredentials'])
                ? (optionsBody['allowCredentials'] as Record<string, unknown>[])
                : [];

            const allowCredentials: PublicKeyCredentialDescriptor[] = rawCredentials
                .filter(c => typeof c['id'] === 'string')
                .map(c => ({
                    id: this.base64UrlToUint8Array(c['id'] as string) as unknown as BufferSource,
                    type: 'public-key'
                }));

            const publicKeyOptions: PublicKeyCredentialRequestOptions = {
                challenge: this.base64UrlToUint8Array(optionsBody['challenge']) as unknown as BufferSource,
                allowCredentials,
                userVerification: 'preferred',
                timeout: 60000
            };

            if (typeof optionsBody['rpId'] === 'string' && optionsBody['rpId']) {
                publicKeyOptions.rpId = optionsBody['rpId'];
            }

            const assertion = (await navigator.credentials.get({
                publicKey: publicKeyOptions
            })) as PublicKeyCredential | null;

            if (!assertion) {
                this.authError = 'YubiKey authentication was cancelled.';
                return;
            }

            const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
            const verifyRes = await fetch(this.webauthnLoginVerifyUrl, {
                method: 'POST',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json'
                }),
                body: JSON.stringify({
                    username: trimmedUser,
                    ['credential_id']: assertion.id,
                    ['authenticator_data']: this.bufferToBase64Url(assertionResponse.authenticatorData),
                    ['client_data_json']: this.bufferToBase64Url(assertionResponse.clientDataJSON),
                    signature: this.bufferToBase64Url(assertionResponse.signature)
                })
            });

            this.captureBookmark(verifyRes);
            this.captureBookmark(verifyRes);
            const verifyBody = (await verifyRes.json()) as Record<string, unknown>;

            if (verifyRes.ok && typeof verifyBody['token'] === 'string') {
                const resolvedUser =
                    typeof verifyBody['username'] === 'string' && verifyBody['username']
                        ? verifyBody['username']
                        : trimmedUser;
                this.saveSession(verifyBody['token'], resolvedUser);
            } else {
                this.authError =
                    typeof verifyBody['error'] === 'string'
                        ? verifyBody['error']
                        : 'YubiKey verification failed.';
            }
        } catch {
            this.authError = 'YubiKey authentication failed or was cancelled.';
        } finally {
            this.authenticating = false;
            this.cdr.detectChanges();
        }
    }

    toggleSecuritySettings(): void {
        this.showSecuritySettings = !this.showSecuritySettings;
        if (this.showSecuritySettings) {
            void this.loadTwoFaStatus();
        }
    }

    async loadTwoFaStatus(): Promise<void> {
        const currentToken = this.sessionToken;
        if (!currentToken) return;

        try {
            const res = await fetch(this.twoFaStatusUrl, {
                headers: this.getRequestHeaders({
                    ['Authorization']: `Bearer ${currentToken}`
                })
            });
            if (!res.ok) return;
            this.captureBookmark(res);

            const body = (await res.json()) as Record<string, unknown>;
            if (this.sessionToken !== currentToken) return;
            const rawPasskeys = Array.isArray(body['passkeys'])
                ? (body['passkeys'] as Record<string, unknown>[])
                : [];
            this.passkeys = rawPasskeys
                .filter(p => typeof p['credential_id'] === 'string')
                .map((p, index) => ({
                    id: typeof p['id'] === 'number' ? p['id'] : index + 1,
                    credentialId: p['credential_id'] as string,
                    label:
                        typeof p['label'] === 'string' && p['label']
                            ? p['label']
                            : `Security Key #${index + 1}`,
                    createdAt: typeof p['created_at'] === 'string' ? p['created_at'] : ''
                }));
            this.totpEnabled = Boolean(body['totp_enabled']);
            this.webauthnEnabled = Boolean(body['webauthn_enabled']) || this.passkeys.length > 0;
        } catch {
            // Non-blocking status check
        } finally {
            this.cdr.detectChanges();
        }
    }

    async setupTotp(): Promise<void> {
        const setupToken = this.sessionToken;
        if (!setupToken) return;
        this.securityError = '';
        this.securityMessage = '';
        this.totpQrDataUrl = '';
        this.totpVerifyCode = '';

        try {
            const res = await fetch(this.totpSetupUrl, {
                method: 'POST',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json',
                    ['Authorization']: `Bearer ${setupToken}`
                })
            });

            const body = (await res.json()) as Record<string, unknown>;
            if (this.sessionToken !== setupToken) return;
            if (res.ok && typeof body['secret'] === 'string') {
                this.totpSetupSecret = body['secret'];
                this.totpSetupUri =
                    typeof body['otpauth_url'] === 'string'
                        ? body['otpauth_url']
                        : `otpauth://totp/AirportTracker:${encodeURIComponent(this.loggedInUser || 'User')}?secret=${this.totpSetupSecret}&issuer=AirportTracker`;
                this.totpQrDataUrl = generateQrCodeDataUrl(this.totpSetupUri);
                this.totpPendingVerification = true;
                this.securityMessage =
                    'Scan the QR code below, then enter a 6-digit code from your app to verify and enable 2FA.';
            } else {
                this.securityError =
                    typeof body['error'] === 'string'
                        ? body['error']
                        : 'Failed to generate Authenticator secret.';
            }
        } catch {
            this.securityError = 'Network error while setting up Authenticator 2FA.';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async verifyTotp(): Promise<void> {
        const verifyToken = this.sessionToken;
        const code = this.totpVerifyCode.trim();
        if (!verifyToken) return;
        if (!code) {
            this.securityError = 'Enter the 6-digit code from your Authenticator app to verify.';
            this.cdr.detectChanges();
            return;
        }

        this.securityError = '';
        this.securityMessage = '';

        try {
            const res = await fetch(this.totpVerifyUrl, {
                method: 'POST',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json',
                    ['Authorization']: `Bearer ${verifyToken}`
                }),
                body: JSON.stringify({ code })
            });

            this.captureBookmark(res);
            const body = (await res.json()) as Record<string, unknown>;
            if (this.sessionToken !== verifyToken) return;

            if (res.ok) {
                this.totpEnabled = true;
                this.totpPendingVerification = false;
                this.totpVerifyCode = '';
                this.totpSetupSecret = '';
                this.totpSetupUri = '';
                this.totpQrDataUrl = '';
                this.securityMessage = 'Microsoft Authenticator 2FA verified and enabled!';
            } else {
                this.securityError =
                    typeof body['error'] === 'string'
                        ? body['error']
                        : 'Invalid verification code. Please try again.';
            }
        } catch {
            this.securityError = 'Network error while verifying Authenticator code.';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async disableTotp(): Promise<void> {
        const currentToken = this.sessionToken;
        if (!currentToken) return;
        this.securityError = '';
        this.securityMessage = '';

        try {
            const res = await fetch(this.totpDisableUrl, {
                method: 'DELETE',
                headers: this.getRequestHeaders({
                    ['Authorization']: `Bearer ${currentToken}`
                })
            });

            this.captureBookmark(res);
            if (this.sessionToken !== currentToken) return;

            if (res.ok) {
                this.totpEnabled = false;
                this.totpPendingVerification = false;
                this.totpVerifyCode = '';
                this.totpSetupSecret = '';
                this.totpSetupUri = '';
                this.totpQrDataUrl = '';
                this.securityMessage = 'Authenticator 2FA has been disabled.';
            } else {
                const body = (await res.json()) as Record<string, unknown>;
                this.securityError =
                    typeof body['error'] === 'string'
                        ? body['error']
                        : 'Failed to disable Authenticator 2FA.';
            }
        } catch {
            this.securityError = 'Network error while disabling Authenticator 2FA.';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async disableWebAuthn(): Promise<void> {
        const currentToken = this.sessionToken;
        if (!currentToken) return;
        this.securityError = '';
        this.securityMessage = '';

        try {
            const res = await fetch(this.webauthnDisableUrl, {
                method: 'DELETE',
                headers: this.getRequestHeaders({
                    ['Authorization']: `Bearer ${currentToken}`
                })
            });

            this.captureBookmark(res);
            if (this.sessionToken !== currentToken) return;

            if (res.ok) {
                this.webauthnEnabled = false;
                this.passkeys = [];
                this.securityMessage = 'All YubiKeys / Passkeys have been removed.';
            } else {
                const body = (await res.json()) as Record<string, unknown>;
                this.securityError =
                    typeof body['error'] === 'string'
                        ? body['error']
                        : 'Failed to remove YubiKey.';
            }
        } catch {
            this.securityError = 'Network error while removing YubiKey.';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async renamePasskey(credentialId: string): Promise<void> {
        const currentToken = this.sessionToken;
        if (!currentToken || !credentialId) return;

        const passkey = this.passkeys.find(p => p.credentialId === credentialId);
        if (!passkey) return;

        const newLabel =
            typeof prompt === 'function'
                ? prompt('Enter a new label for this passkey:', passkey.label)
                : null;
        const trimmedLabel = newLabel ? newLabel.trim() : '';
        if (!trimmedLabel || trimmedLabel === passkey.label) return;

        this.securityError = '';
        this.securityMessage = '';

        try {
            const res = await fetch(this.webauthnEditOptionsUrl, {
                method: 'PATCH',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json',
                    ['Authorization']: `Bearer ${currentToken}`
                }),
                body: JSON.stringify({
                    ['credential_id']: credentialId,
                    label: trimmedLabel
                })
            });

            this.captureBookmark(res);
            if (this.sessionToken !== currentToken) return;

            if (res.ok) {
                passkey.label = trimmedLabel;
                this.securityMessage = 'Passkey label updated.';
            } else {
                const body = (await res.json()) as Record<string, unknown>;
                this.securityError =
                    typeof body['error'] === 'string'
                        ? body['error']
                        : 'Failed to update passkey label.';
            }
        } catch {
            this.securityError = 'Network error while updating passkey label.';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async deletePasskey(credentialId: string): Promise<void> {
        const currentToken = this.sessionToken;
        if (!currentToken || !credentialId) return;
        this.securityError = '';
        this.securityMessage = '';

        try {
            const res = await fetch(
                `${this.webauthnDisableUrl}?credential_id=${encodeURIComponent(credentialId)}`,
                {
                    method: 'DELETE',
                    headers: this.getRequestHeaders({
                        ['Authorization']: `Bearer ${currentToken}`
                    })
                }
            );

            this.captureBookmark(res);
            if (this.sessionToken !== currentToken) return;

            if (res.ok) {
                this.passkeys = this.passkeys.filter(p => p.credentialId !== credentialId);
                this.webauthnEnabled = this.passkeys.length > 0;
                this.securityMessage = 'Passkey removed.';
            } else {
                const body = (await res.json()) as Record<string, unknown>;
                this.securityError =
                    typeof body['error'] === 'string'
                        ? body['error']
                        : 'Failed to remove passkey.';
            }
        } catch {
            this.securityError = 'Network error while removing passkey.';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async registerYubiKey(): Promise<void> {
        if (!this.sessionToken) return;
        if (typeof navigator === 'undefined' || !navigator.credentials) {
            this.securityError = 'WebAuthn security keys are not supported in this browser.';
            this.cdr.detectChanges();
            return;
        }

        this.securityError = '';
        this.securityMessage = '';

        try {
            const optionsRes = await fetch(this.webauthnRegisterOptionsUrl, {
                method: 'POST',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json',
                    ['Authorization']: `Bearer ${this.sessionToken}`
                })
            });

            this.captureBookmark(optionsRes);
            const optionsBody = (await optionsRes.json()) as Record<string, unknown>;
            if (!optionsRes.ok || typeof optionsBody['challenge'] !== 'string') {
                this.securityError =
                    typeof optionsBody['error'] === 'string'
                        ? optionsBody['error']
                        : 'Failed to start YubiKey registration.';
                return;
            }

            const rpId =
                typeof optionsBody['rpId'] === 'string' && optionsBody['rpId']
                    ? optionsBody['rpId']
                    : typeof window !== 'undefined'
                      ? window.location.hostname
                      : 'localhost';

            const rawExclude = Array.isArray(optionsBody['excludeCredentials'])
                ? (optionsBody['excludeCredentials'] as Record<string, unknown>[])
                : [];
            const excludeCredentials: PublicKeyCredentialDescriptor[] = rawExclude
                .filter(c => typeof c['id'] === 'string')
                .map(c => ({
                    id: this.base64UrlToUint8Array(c['id'] as string) as unknown as BufferSource,
                    type: 'public-key'
                }));

            const userBytes = new TextEncoder().encode(this.loggedInUser || 'user');
            const credential = (await navigator.credentials.create({
                publicKey: {
                    challenge: this.base64UrlToUint8Array(optionsBody['challenge']) as unknown as BufferSource,
                    rp: {
                        name: 'Charlie Airport Tracker',
                        id: rpId
                    },
                    user: {
                        id: userBytes as unknown as BufferSource,
                        name: this.loggedInUser,
                        displayName: this.loggedInUser
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: 'public-key' },
                        { alg: -257, type: 'public-key' }
                    ],
                    excludeCredentials,
                    authenticatorSelection: {
                        userVerification: 'preferred'
                    },
                    timeout: 60000
                }
            })) as PublicKeyCredential | null;

            if (!credential) {
                this.securityError = 'YubiKey registration was cancelled.';
                return;
            }

            const attestation = credential.response as AuthenticatorAttestationResponse & {
                getPublicKey?: () => ArrayBuffer | null;
            };
            const spkiBuffer = attestation.getPublicKey ? attestation.getPublicKey() : null;
            if (!spkiBuffer) {
                this.securityError = 'Browser did not return a public key for the security key.';
                return;
            }

            const verifyPayload: Record<string, string> = {
                ['credential_id']: credential.id,
                ['public_key']: this.bufferToBase64Url(spkiBuffer)
            };
            const trimmedLabel = this.passkeyLabel.trim();
            if (trimmedLabel) {
                verifyPayload['label'] = trimmedLabel;
            }

            const verifyRes = await fetch(this.webauthnRegisterVerifyUrl, {
                method: 'POST',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json',
                    ['Authorization']: `Bearer ${this.sessionToken}`
                }),
                body: JSON.stringify(verifyPayload)
            });

            this.captureBookmark(verifyRes);
            const verifyBody = (await verifyRes.json()) as Record<string, unknown>;
            if (verifyRes.ok) {
                this.webauthnEnabled = true;
                this.passkeyLabel = '';
                this.securityMessage = 'YubiKey registered! You can now sign in with your security key.';
                await this.loadTwoFaStatus();
            } else {
                this.securityError =
                    typeof verifyBody['error'] === 'string'
                        ? verifyBody['error']
                        : 'Failed to save YubiKey credential.';
            }
        } catch {
            this.securityError = 'YubiKey registration failed or was cancelled.';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async onLogout(): Promise<void> {
        const currentToken = this.sessionToken;
        this.clearSession();
        this.submitError = '';
        this.submitSuccess = '';
        this.cdr.detectChanges();

        if (!currentToken) return;

        try {
            await fetch(this.logoutUrl, {
                method: 'POST',
                headers: this.getRequestHeaders({
                    ['Authorization']: `Bearer ${currentToken}`
                })
            });
        } catch {
            // Local session is already cleared
        }
    }

    private mapVisits(rawVisits: Record<string, unknown>[]): VisitItem[] {
        return rawVisits.map(v => {
            const rawDistance = v['distance_km'];
            const parsedDistance =
                typeof rawDistance === 'number'
                    ? rawDistance
                    : typeof rawDistance === 'string' && rawDistance !== ''
                      ? Number(rawDistance)
                      : null;

            return {
                id: typeof v['id'] === 'number' ? v['id'] : Number(v['id'] || 0),
                username: typeof v['username'] === 'string' && v['username'] ? v['username'] : 'Anonymous',
                iataCode: typeof v['iata_code'] === 'string' ? v['iata_code'] : '',
                originIata: typeof v['origin_iata'] === 'string' ? v['origin_iata'] : '',
                flightNumber: typeof v['flight_number'] === 'string' ? v['flight_number'] : '',
                distanceKm: parsedDistance !== null && Number.isFinite(parsedDistance) ? parsedDistance : null,
                airportName:
                    typeof v['airport_name'] === 'string' && v['airport_name']
                        ? v['airport_name']
                        : 'Unknown Airport',
                city: typeof v['city'] === 'string' ? v['city'] : '',
                country: typeof v['country'] === 'string' ? v['country'] : '',
                visitDate: typeof v['visit_date'] === 'string' ? v['visit_date'] : '',
                notes: typeof v['notes'] === 'string' ? v['notes'] : ''
            };
        });
    }

    async loadStats(username?: string): Promise<void> {
        try {
            const query = username ? `?username=${encodeURIComponent(username)}` : '';
            const res = await fetch(
                `${this.statsUrl}${query}`,
                Object.keys(this.getRequestHeaders()).length > 0
                    ? { headers: this.getRequestHeaders() }
                    : undefined
            );
            if (!res.ok) return;
            this.captureBookmark(res);

            const raw = (await res.json()) as Record<string, unknown>;
            const rawMostVisited = Array.isArray(raw['most_visited_airports'])
                ? (raw['most_visited_airports'] as Record<string, unknown>[])
                : undefined;
            const rawCountries = Array.isArray(raw['countries_visited'])
                ? (raw['countries_visited'] as Record<string, unknown>[])
                : undefined;
            const rawYears = Array.isArray(raw['visits_by_year'])
                ? (raw['visits_by_year'] as Record<string, unknown>[])
                : undefined;

            const mappedStats: TravelStats = {
                totalVisits: Number(raw['total_visits'] ?? 0),
                uniqueAirports: Number(raw['unique_airports'] ?? 0),
                uniqueCountries: Number(raw['unique_countries'] ?? 0),
                totalDistanceKm: Number(raw['total_distance_km'] ?? 0),
                totalDistanceMiles: Number(raw['total_distance_miles'] ?? 0)
            };

            if (typeof raw['first_visit_date'] === 'string') {
                mappedStats.firstVisitDate = raw['first_visit_date'];
            }
            if (typeof raw['last_visit_date'] === 'string') {
                mappedStats.lastVisitDate = raw['last_visit_date'];
            }
            if (rawMostVisited) {
                mappedStats.mostVisitedAirports = rawMostVisited.map(a => ({
                    iataCode: typeof a['iata_code'] === 'string' ? a['iata_code'] : '',
                    airportName: typeof a['airport_name'] === 'string' ? a['airport_name'] : '',
                    city: typeof a['city'] === 'string' ? a['city'] : '',
                    country: typeof a['country'] === 'string' ? a['country'] : '',
                    visitCount: Number(a['visit_count'] ?? 0)
                }));
            }
            if (rawCountries) {
                mappedStats.countriesVisited = rawCountries.map(c => ({
                    country: typeof c['country'] === 'string' ? c['country'] : '',
                    visitCount: Number(c['visit_count'] ?? 0),
                    uniqueAirports: Number(c['unique_airports'] ?? 0)
                }));
            }
            if (rawYears) {
                mappedStats.visitsByYear = rawYears.map(y => ({
                    year: typeof y['year'] === 'string' ? y['year'] : String(y['year'] ?? ''),
                    visitCount: Number(y['visit_count'] ?? 0),
                    uniqueAirports: Number(y['unique_airports'] ?? 0)
                }));
            }

            this.stats = mappedStats;
        } catch {
            // Stats are non-blocking; ignore errors if endpoint is unavailable
        } finally {
            this.cdr.detectChanges();
        }
    }

    async loadVisits(): Promise<void> {
        this.loading = true;
        this.error = '';

        try {
            const headers = this.getRequestHeaders();
            const res = await fetch(
                this.apiUrl,
                Object.keys(headers).length > 0 ? { headers } : undefined
            );
            this.captureBookmark(res);
            const rawVisits = (await res.json()) as Record<string, unknown>[];
            this.visits = this.mapVisits(rawVisits);
        } catch {
            this.error = 'Failed to load visits.';
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async loadUserVisits(): Promise<void> {
        const targetUsername = (this.filterUsername || this.loggedInUser).trim();
        if (!targetUsername) {
            await this.loadVisits();
            await this.loadStats();
            return;
        }

        this.loading = true;
        this.error = '';

        try {
            const headers = this.getRequestHeaders();
            const res = await fetch(
                `${this.apiUrl}?username=${encodeURIComponent(targetUsername)}`,
                Object.keys(headers).length > 0 ? { headers } : undefined
            );
            this.captureBookmark(res);
            const rawVisits = (await res.json()) as Record<string, unknown>[];
            this.visits = this.mapVisits(rawVisits);
            void this.loadStats(targetUsername);
        } catch {
            this.error = 'Failed to load user visits.';
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async clearUserFilter(): Promise<void> {
        this.filterUsername = '';
        await this.loadVisits();
        await this.loadStats();
    }

    startEdit(visit: VisitItem): void {
        this.editingVisitId = visit.id;
        this.originIata = visit.originIata;
        this.iataCode = visit.iataCode;
        this.flightNumber = visit.flightNumber;
        this.airportName = visit.airportName === 'Unknown Airport' ? '' : visit.airportName;
        this.visitDate = visit.visitDate;
        this.notes = visit.notes;
        this.submitError = '';
        this.submitSuccess = '';
    }

    cancelEdit(): void {
        this.editingVisitId = null;
        this.resetFormFields();
        this.submitError = '';
    }

    private resetFormFields(): void {
        this.originIata = '';
        this.iataCode = '';
        this.flightNumber = '';
        this.airportName = '';
        this.visitDate = '';
        this.notes = '';
    }

    async onSubmit(): Promise<void> {
        if (!this.sessionToken) {
            this.submitError = 'Please sign in first to log or edit visits.';
            this.cdr.detectChanges();
            return;
        }

        this.submitting = true;
        this.submitError = '';
        this.submitSuccess = '';

        const data: Record<string, string | number> = {
            username: this.loggedInUser,
            ['iata_code']: this.iataCode.trim().toUpperCase(),
            ['visit_date']: this.visitDate,
            notes: this.notes
        };

        if (this.originIata.trim()) {
            data['origin_iata'] = this.originIata.trim().toUpperCase();
        }
        if (this.flightNumber.trim()) {
            data['flight_number'] = this.flightNumber.trim().toUpperCase();
        }
        if (this.airportName.trim()) {
            data['airport_name'] = this.airportName.trim();
        }

        const isEditing = this.editingVisitId !== null;
        const targetUrl = isEditing ? `${this.apiUrl}/${this.editingVisitId}` : this.apiUrl;
        const method = isEditing ? 'PATCH' : 'POST';

        try {
            const res = await fetch(targetUrl, {
                method,
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json',
                    ['Authorization']: `Bearer ${this.sessionToken}`
                }),
                body: JSON.stringify(data)
            });

            this.captureBookmark(res);

            if (res.ok) {
                this.editingVisitId = null;
                this.resetFormFields();
                this.submitSuccess = isEditing ? 'Visit updated successfully.' : 'Visit logged successfully.';
                this.cdr.detectChanges();

                const activeFilter = this.filterUsername.trim();
                if (activeFilter) {
                    await this.loadUserVisits();
                } else {
                    await this.loadVisits();
                    await this.loadStats();
                }
            } else {
                let errorMessage = 'Unauthorized: Session expired or failed to log visit.';
                try {
                    const errBody = (await res.json()) as Record<string, unknown>;
                    if (typeof errBody['error'] === 'string' && errBody['error']) {
                        errorMessage = errBody['error'];
                    }
                } catch {
                    // Keep default message if response body is not JSON
                }
                if (res.status === 401) {
                    this.clearSession();
                }
                this.submitError = errorMessage;
            }
        } catch {
            this.submitError = 'Network error: Failed to save visit.';
        } finally {
            this.submitting = false;
            this.cdr.detectChanges();
        }
    }

    async deleteVisit(id: number): Promise<void> {
        if (!this.sessionToken) {
            this.submitError = 'Please sign in first to delete a visit.';
            this.cdr.detectChanges();
            return;
        }

        this.submitError = '';
        this.submitSuccess = '';

        try {
            const res = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json',
                    ['Authorization']: `Bearer ${this.sessionToken}`
                }),
                body: JSON.stringify({ id })
            });

            this.captureBookmark(res);

            if (res.ok) {
                this.visits = this.visits.filter(v => v.id !== id);
                this.submitSuccess = 'Visit deleted.';
                void this.loadStats(this.filterUsername.trim() || undefined);
            } else {
                if (res.status === 401) {
                    this.clearSession();
                }
                this.submitError = 'Failed to delete visit. Your session may have expired.';
            }
        } catch {
            this.submitError = 'Network error: Failed to delete visit.';
        } finally {
            this.cdr.detectChanges();
        }
    }
}
