import QRCode from 'qrcode'

/** Data URL of a QR code encoding `text`, high error-correction so a small
 *  logo can safely overlay its center without breaking scannability. */
export function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 512,
    color: { dark: '#0b1a12', light: '#ffffff' },
  })
}
