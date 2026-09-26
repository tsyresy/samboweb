export type CsvCell = string | number | null | undefined

function escapeCell(value: CsvCell) {
  if (value === null || value === undefined) return ''
  let text = String(value)
  // A name or reference typed by a member must not run as a formula when the
  // file is opened in Excel / LibreOffice (CSV injection).
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Downloads rows as a CSV that French Excel opens directly: `;` separator,
 *  UTF-8 BOM so accents survive, CRLF line endings. */
export function downloadCsv(filename: string, rows: CsvCell[][]) {
  const content = '﻿' + rows.map((row) => row.map(escapeCell).join(';')).join('\r\n') + '\r\n'
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
