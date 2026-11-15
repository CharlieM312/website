interface QrVersionSpec {
    version: number;
    totalDataCodewords: number;
    ecCodewordsPerBlock: number;
    group1Blocks: number;
    group1DataCodewords: number;
    group2Blocks: number;
    group2DataCodewords: number;
    alignmentCenters: number[];
}

const versionSpecs: QrVersionSpec[] = [
    {
        version: 1,
        totalDataCodewords: 19,
        ecCodewordsPerBlock: 7,
        group1Blocks: 1,
        group1DataCodewords: 19,
        group2Blocks: 0,
        group2DataCodewords: 0,
        alignmentCenters: []
    },
    {
        version: 2,
        totalDataCodewords: 34,
        ecCodewordsPerBlock: 10,
        group1Blocks: 1,
        group1DataCodewords: 34,
        group2Blocks: 0,
        group2DataCodewords: 0,
        alignmentCenters: [6, 18]
    },
    {
        version: 3,
        totalDataCodewords: 55,
        ecCodewordsPerBlock: 15,
        group1Blocks: 1,
        group1DataCodewords: 55,
        group2Blocks: 0,
        group2DataCodewords: 0,
        alignmentCenters: [6, 22]
    },
    {
        version: 4,
        totalDataCodewords: 80,
        ecCodewordsPerBlock: 20,
        group1Blocks: 1,
        group1DataCodewords: 80,
        group2Blocks: 0,
        group2DataCodewords: 0,
        alignmentCenters: [6, 26]
    },
    {
        version: 5,
        totalDataCodewords: 108,
        ecCodewordsPerBlock: 26,
        group1Blocks: 1,
        group1DataCodewords: 108,
        group2Blocks: 0,
        group2DataCodewords: 0,
        alignmentCenters: [6, 30]
    },
    {
        version: 6,
        totalDataCodewords: 136,
        ecCodewordsPerBlock: 18,
        group1Blocks: 2,
        group1DataCodewords: 68,
        group2Blocks: 0,
        group2DataCodewords: 0,
        alignmentCenters: [6, 34]
    },
    {
        version: 7,
        totalDataCodewords: 156,
        ecCodewordsPerBlock: 20,
        group1Blocks: 2,
        group1DataCodewords: 78,
        group2Blocks: 0,
        group2DataCodewords: 0,
        alignmentCenters: [6, 22, 38]
    },
    {
        version: 8,
        totalDataCodewords: 194,
        ecCodewordsPerBlock: 24,
        group1Blocks: 2,
        group1DataCodewords: 97,
        group2Blocks: 0,
        group2DataCodewords: 0,
        alignmentCenters: [6, 24, 42]
    },
    {
        version: 9,
        totalDataCodewords: 232,
        ecCodewordsPerBlock: 30,
        group1Blocks: 2,
        group1DataCodewords: 116,
        group2Blocks: 0,
        group2DataCodewords: 0,
        alignmentCenters: [6, 26, 46]
    },
    {
        version: 10,
        totalDataCodewords: 274,
        ecCodewordsPerBlock: 18,
        group1Blocks: 2,
        group1DataCodewords: 68,
        group2Blocks: 2,
        group2DataCodewords: 69,
        alignmentCenters: [6, 28, 50]
    }
];

function gfMultiply(x: number, y: number): number {
    let result = 0;
    let a = x;
    let b = y;
    for (let i = 0; i < 8; i++) {
        if ((b & 1) !== 0) {
            result ^= a;
        }
        const highBit = a & 0x80;
        a = (a << 1) & 0xff;
        if (highBit !== 0) {
            a ^= 0x1d;
        }
        b >>= 1;
    }
    return result;
}

function buildReedSolomonDivisor(degree: number): Uint8Array {
    const result = new Uint8Array(degree);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
        for (let j = 0; j < degree; j++) {
            result[j] = gfMultiply(result[j], root);
            if (j + 1 < degree) {
                result[j] ^= result[j + 1];
            }
        }
        root = gfMultiply(root, 0x02);
    }
    return result;
}

function computeReedSolomonRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
    const result = new Uint8Array(divisor.length);
    for (const byte of data) {
        const factor = byte ^ result[0];
        result.copyWithin(0, 1);
        result[result.length - 1] = 0;
        for (let i = 0; i < divisor.length; i++) {
            result[i] ^= gfMultiply(divisor[i], factor);
        }
    }
    return result;
}

function appendBits(val: number, len: number, bits: number[]): void {
    for (let i = len - 1; i >= 0; i--) {
        bits.push((val >>> i) & 1);
    }
}

function encodeCodewords(payloadBytes: Uint8Array, spec: QrVersionSpec): Uint8Array {
    const bits: number[] = [];
    const countBits = spec.version <= 9 ? 8 : 16;
    appendBits(0b0100, 4, bits);
    appendBits(payloadBytes.length, countBits, bits);
    for (const byte of payloadBytes) {
        appendBits(byte, 8, bits);
    }

    const capacityBits = spec.totalDataCodewords * 8;
    const terminatorLen = Math.min(4, capacityBits - bits.length);
    appendBits(0, terminatorLen, bits);

    while (bits.length % 8 !== 0) {
        bits.push(0);
    }

    const dataCodewords = new Uint8Array(spec.totalDataCodewords);
    const byteLen = bits.length / 8;
    for (let i = 0; i < byteLen; i++) {
        let val = 0;
        for (let j = 0; j < 8; j++) {
            val = (val << 1) | bits[i * 8 + j];
        }
        dataCodewords[i] = val;
    }

    let padToggle = true;
    for (let i = byteLen; i < spec.totalDataCodewords; i++) {
        dataCodewords[i] = padToggle ? 0xec : 0x11;
        padToggle = !padToggle;
    }

    const dataBlocks: Uint8Array[] = [];
    const ecBlocks: Uint8Array[] = [];
    const divisor = buildReedSolomonDivisor(spec.ecCodewordsPerBlock);
    let offset = 0;

    for (let i = 0; i < spec.group1Blocks; i++) {
        const block = dataCodewords.slice(offset, offset + spec.group1DataCodewords);
        offset += spec.group1DataCodewords;
        dataBlocks.push(block);
        ecBlocks.push(computeReedSolomonRemainder(block, divisor));
    }

    for (let i = 0; i < spec.group2Blocks; i++) {
        const block = dataCodewords.slice(offset, offset + spec.group2DataCodewords);
        offset += spec.group2DataCodewords;
        dataBlocks.push(block);
        ecBlocks.push(computeReedSolomonRemainder(block, divisor));
    }

    const totalBlocks = dataBlocks.length;
    const maxDataLen = Math.max(spec.group1DataCodewords, spec.group2DataCodewords);
    const interleaved: number[] = [];

    for (let i = 0; i < maxDataLen; i++) {
        for (let b = 0; b < totalBlocks; b++) {
            if (i < dataBlocks[b].length) {
                interleaved.push(dataBlocks[b][i]);
            }
        }
    }

    for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
        for (let b = 0; b < totalBlocks; b++) {
            interleaved.push(ecBlocks[b][i]);
        }
    }

    return new Uint8Array(interleaved);
}

function setFunctionModule(
    modules: boolean[][],
    isFunction: boolean[][],
    row: number,
    col: number,
    isDark: boolean
): void {
    modules[row][col] = isDark;
    isFunction[row][col] = true;
}

function drawFinderPattern(
    modules: boolean[][],
    isFunction: boolean[][],
    size: number,
    centerRow: number,
    centerCol: number
): void {
    for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
            const r = centerRow + dy;
            const c = centerCol + dx;
            if (r >= 0 && r < size && c >= 0 && c < size) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                const isDark = dist !== 2 && dist !== 4;
                setFunctionModule(modules, isFunction, r, c, isDark);
            }
        }
    }
}

function drawAlignmentPattern(
    modules: boolean[][],
    isFunction: boolean[][],
    centerRow: number,
    centerCol: number
): void {
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const dist = Math.max(Math.abs(dx), Math.abs(dy));
            setFunctionModule(modules, isFunction, centerRow + dy, centerCol + dx, dist !== 1);
        }
    }
}

function drawFormatBits(
    modules: boolean[][],
    isFunction: boolean[][],
    size: number,
    mask: number
): void {
    // Error correction level L = 01
    const data = (0b01 << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) {
        rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i++) {
        setFunctionModule(modules, isFunction, i, 8, ((bits >>> i) & 1) !== 0);
    }
    setFunctionModule(modules, isFunction, 7, 8, ((bits >>> 6) & 1) !== 0);
    setFunctionModule(modules, isFunction, 8, 8, ((bits >>> 7) & 1) !== 0);
    setFunctionModule(modules, isFunction, 8, 7, ((bits >>> 8) & 1) !== 0);
    for (let i = 9; i < 15; i++) {
        setFunctionModule(modules, isFunction, 8, 14 - i, ((bits >>> i) & 1) !== 0);
    }

    for (let i = 0; i < 8; i++) {
        setFunctionModule(modules, isFunction, 8, size - 1 - i, ((bits >>> i) & 1) !== 0);
    }
    for (let i = 8; i < 15; i++) {
        setFunctionModule(modules, isFunction, size - 15 + i, 8, ((bits >>> i) & 1) !== 0);
    }
    setFunctionModule(modules, isFunction, size - 8, 8, true);
}

function drawVersionBits(
    modules: boolean[][],
    isFunction: boolean[][],
    size: number,
    version: number
): void {
    if (version < 7) return;
    let rem = version;
    for (let i = 0; i < 12; i++) {
        rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
        const bit = ((bits >>> i) & 1) !== 0;
        const a = size - 11 + (i % 3);
        const b = Math.floor(i / 3);
        setFunctionModule(modules, isFunction, a, b, bit);
        setFunctionModule(modules, isFunction, b, a, bit);
    }
}

function shouldInvertMask(mask: number, row: number, col: number): boolean {
    switch (mask) {
        case 0:
            return (row + col) % 2 === 0;
        case 1:
            return row % 2 === 0;
        case 2:
            return col % 3 === 0;
        case 3:
            return (row + col) % 3 === 0;
        case 4:
            return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
        case 5:
            return ((row * col) % 2) + ((row * col) % 3) === 0;
        case 6:
            return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
        default:
            return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
    }
}

function computePenalty(modules: boolean[][]): number {
    const size = modules.length;
    let penalty = 0;

    for (let r = 0; r < size; r++) {
        let runColor = modules[r][0];
        let runLen = 1;
        for (let c = 1; c < size; c++) {
            if (modules[r][c] === runColor) {
                runLen++;
                if (runLen === 5) penalty += 3;
                else if (runLen > 5) penalty += 1;
            } else {
                runColor = modules[r][c];
                runLen = 1;
            }
        }
    }

    for (let c = 0; c < size; c++) {
        let runColor = modules[0][c];
        let runLen = 1;
        for (let r = 1; r < size; r++) {
            if (modules[r][c] === runColor) {
                runLen++;
                if (runLen === 5) penalty += 3;
                else if (runLen > 5) penalty += 1;
            } else {
                runColor = modules[r][c];
                runLen = 1;
            }
        }
    }

    for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
            const color = modules[r][c];
            if (
                color === modules[r][c + 1] &&
                color === modules[r + 1][c] &&
                color === modules[r + 1][c + 1]
            ) {
                penalty += 3;
            }
        }
    }

    return penalty;
}

export function createQrMatrix(text: string): boolean[][] {
    const payloadBytes = new TextEncoder().encode(text);
    const spec = versionSpecs.find(s => {
        const countBytes = s.version <= 9 ? 1 : 2;
        return payloadBytes.length + countBytes + 1 <= s.totalDataCodewords;
    });

    if (!spec) {
        throw new Error('QR payload exceeds supported version capacity.');
    }

    const size = spec.version * 4 + 17;
    const baseModules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
    const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);

    for (let i = 0; i < size; i++) {
        setFunctionModule(baseModules, isFunction, 6, i, i % 2 === 0);
        setFunctionModule(baseModules, isFunction, i, 6, i % 2 === 0);
    }

    drawFinderPattern(baseModules, isFunction, size, 3, 3);
    drawFinderPattern(baseModules, isFunction, size, 3, size - 4);
    drawFinderPattern(baseModules, isFunction, size, size - 4, 3);

    const centers = spec.alignmentCenters;
    for (let i = 0; i < centers.length; i++) {
        for (let j = 0; j < centers.length; j++) {
            const isCornerFinder =
                (i === 0 && j === 0) ||
                (i === 0 && j === centers.length - 1) ||
                (i === centers.length - 1 && j === 0);
            if (!isCornerFinder) {
                drawAlignmentPattern(baseModules, isFunction, centers[i], centers[j]);
            }
        }
    }

    drawFormatBits(baseModules, isFunction, size, 0);
    drawVersionBits(baseModules, isFunction, size, spec.version);

    const codewords = encodeCodewords(payloadBytes, spec);
    let bitIndex = 0;
    const totalBits = codewords.length * 8;

    for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
        if (rightCol === 6) {
            rightCol = 5;
        }
        const upward = ((rightCol + 1) & 2) === 0;
        for (let vert = 0; vert < size; vert++) {
            const r = upward ? size - 1 - vert : vert;
            for (let j = 0; j < 2; j++) {
                const c = rightCol - j;
                if (!isFunction[r][c]) {
                    let dark = false;
                    if (bitIndex < totalBits) {
                        const byteVal = codewords[bitIndex >>> 3];
                        dark = ((byteVal >>> (7 - (bitIndex & 7))) & 1) !== 0;
                        bitIndex++;
                    }
                    baseModules[r][c] = dark;
                }
            }
        }
    }

    let bestMatrix = baseModules;
    let bestPenalty = Number.POSITIVE_INFINITY;

    for (let mask = 0; mask < 8; mask++) {
        const candidate = baseModules.map(row => [...row]);
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!isFunction[r][c] && shouldInvertMask(mask, r, c)) {
                    candidate[r][c] = !candidate[r][c];
                }
            }
        }
        drawFormatBits(candidate, isFunction, size, mask);
        const penalty = computePenalty(candidate);
        if (penalty < bestPenalty) {
            bestPenalty = penalty;
            bestMatrix = candidate;
        }
    }

    return bestMatrix;
}

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ ((crc & 1) !== 0 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
    let a = 1;
    let b = 0;
    for (const byte of bytes) {
        a = (a + byte) % 65521;
        b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
}

function writeUint32BE(target: Uint8Array, offset: number, value: number): void {
    target[offset] = (value >>> 24) & 0xff;
    target[offset + 1] = (value >>> 16) & 0xff;
    target[offset + 2] = (value >>> 8) & 0xff;
    target[offset + 3] = value & 0xff;
}

function buildPngChunk(type: string, data: Uint8Array): Uint8Array {
    const chunk = new Uint8Array(12 + data.length);
    writeUint32BE(chunk, 0, data.length);
    for (let i = 0; i < 4; i++) {
        chunk[4 + i] = type.charCodeAt(i);
    }
    chunk.set(data, 8);
    const crc = crc32(chunk.subarray(4, 8 + data.length));
    writeUint32BE(chunk, 8 + data.length, crc);
    return chunk;
}

export function generateQrCodeDataUrl(text: string, scale = 5, margin = 2): string {
    const matrix = createQrMatrix(text);
    const modulesCount = matrix.length;
    const quietModules = modulesCount + margin * 2;
    const pixelSize = quietModules * scale;

    const rowByteLength = 1 + pixelSize;
    const rawScanlines = new Uint8Array(pixelSize * rowByteLength);

    for (let y = 0; y < pixelSize; y++) {
        const rowOffset = y * rowByteLength;
        rawScanlines[rowOffset] = 0; // Filter type 0 (None)
        const moduleY = Math.floor(y / scale) - margin;
        for (let x = 0; x < pixelSize; x++) {
            const moduleX = Math.floor(x / scale) - margin;
            const isDark =
                moduleY >= 0 &&
                moduleY < modulesCount &&
                moduleX >= 0 &&
                moduleX < modulesCount &&
                matrix[moduleY][moduleX];
            rawScanlines[rowOffset + 1 + x] = isDark ? 0 : 255;
        }
    }

    const maxBlockSize = 65535;
    const numBlocks = Math.ceil(rawScanlines.length / maxBlockSize) || 1;
    const zlibData = new Uint8Array(2 + numBlocks * 5 + rawScanlines.length + 4);
    zlibData[0] = 0x78;
    zlibData[1] = 0x01;

    let zOffset = 2;
    for (let b = 0; b < numBlocks; b++) {
        const start = b * maxBlockSize;
        const end = Math.min(start + maxBlockSize, rawScanlines.length);
        const len = end - start;
        const nlen = ~len & 0xffff;
        zlibData[zOffset++] = b === numBlocks - 1 ? 0x01 : 0x00;
        zlibData[zOffset++] = len & 0xff;
        zlibData[zOffset++] = (len >>> 8) & 0xff;
        zlibData[zOffset++] = nlen & 0xff;
        zlibData[zOffset++] = (nlen >>> 8) & 0xff;
        zlibData.set(rawScanlines.subarray(start, end), zOffset);
        zOffset += len;
    }

    writeUint32BE(zlibData, zOffset, adler32(rawScanlines));

    const ihdr = new Uint8Array(13);
    writeUint32BE(ihdr, 0, pixelSize);
    writeUint32BE(ihdr, 4, pixelSize);
    ihdr[8] = 8; // 8-bit grayscale
    ihdr[9] = 0;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdrChunk = buildPngChunk('IHDR', ihdr);
    const idatChunk = buildPngChunk('IDAT', zlibData);
    const iendChunk = buildPngChunk('IEND', new Uint8Array(0));

    const pngBytes = new Uint8Array(
        signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length
    );
    let offset = 0;
    pngBytes.set(signature, offset);
    offset += signature.length;
    pngBytes.set(ihdrChunk, offset);
    offset += ihdrChunk.length;
    pngBytes.set(idatChunk, offset);
    offset += idatChunk.length;
    pngBytes.set(iendChunk, offset);

    let binary = '';
    for (const byte of pngBytes) {
        binary += String.fromCharCode(byte);
    }

    return `data:image/png;base64,${btoa(binary)}`;
}
