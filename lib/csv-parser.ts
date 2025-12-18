import Papa from 'papaparse'
import { Transaction, CSVRow } from './types'

/**
 * Parses CSV string into Transaction objects
 * @param csvContent - Raw CSV content as string
 * @returns Array of parsed transactions
 * @throws Error if CSV format is invalid
 */
export function parseCSV(csvContent: string): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const validRowsWithIndex = results.data
            .map((row: any, originalIndex: number) => ({ row, originalIndex: originalIndex + 1 }))
            .filter(({ row }: any) => {
              // Skip completely empty rows
              return Object.values(row).some((value: any) => value && typeof value === 'string' && value.trim() !== '')
            })

          const transactions = validRowsWithIndex.map(({ row, originalIndex }: any, index: number) => {
            
            // Validate transaction type first
            const status = row.Status.trim().toUpperCase()
            if (status !== 'BUY' && status !== 'SELL' && status !== 'TAX-FEE' && status !== 'DIVIDEND') {
              throw new Error(`Invalid Status '${row.Status}' in row ${originalIndex}. Must be 'BUY', 'SELL', 'TAX-FEE', or 'DIVIDEND'`)
            }

            // For TAX-FEE and DIVIDEND, Symbol can be empty (it represents a general tax/dividend)
            // For BUY and SELL, Symbol is required
            const isBuyOrSell = status === 'BUY' || status === 'SELL'
            if (isBuyOrSell && !row.Symbol) {
              throw new Error(`Symbol is required for ${status} transactions in row ${originalIndex}`)
            }
            
            // Validate other required fields
            // For TAX-FEE and DIVIDEND, amount share and Price USD can be empty, Total Fee USD can be "-"
            const isTaxOrDividend = status === 'TAX-FEE' || status === 'DIVIDEND'
            const quantityPriceValid = isTaxOrDividend || (row['amount share'] && row['Price USD'])
            const feeFieldValid = isTaxOrDividend || (row['Total Fee USD'] && row['Total Fee USD'] !== '-')
            
            if (!quantityPriceValid || !row.Status || !row['Total Pay USD'] || !feeFieldValid || !row.Date) {
              throw new Error(`Missing required fields in row ${originalIndex}`)
            }

            // Parse and validate numeric values
            let quantity = 0
            let price = 0
            if (!isTaxOrDividend) {
              quantity = parseFloat(row['amount share'].replace(',', '.'))
              price = parseFloat(row['Price USD'].replace(',', '.'))
            }
            const totalPay = parseFloat(row['Total Pay USD'].replace(',', '.'))
            
            // Handle "-" in fee column for TAX-FEE and DIVIDEND transactions
            let fee = 0
            if (row['Total Fee USD'] && row['Total Fee USD'] !== '-') {
              fee = parseFloat(row['Total Fee USD'].replace(',', '.'))
            }

            if (!isTaxOrDividend && (isNaN(quantity) || isNaN(price))) {
              throw new Error(`Invalid numeric values in row ${originalIndex}`)
            }
            if (isNaN(totalPay)) {
              throw new Error(`Invalid Total Pay value in row ${originalIndex}`)
            }

            // Parse date (assuming DD/MM/YYYY format based on example)
            const dateStr = row.Date.trim()
            const dateParts = dateStr.split('/')
            if (dateParts.length !== 3) {
              throw new Error(`Invalid date format '${row.Date}' in row ${originalIndex}. Expected DD/MM/YYYY`)
            }

            const day = parseInt(dateParts[0])
            const month = parseInt(dateParts[1]) - 1 // JavaScript months are 0-indexed
            const year = parseInt(dateParts[2])

            if (isNaN(day) || isNaN(month) || isNaN(year)) {
              throw new Error(`Invalid date values in row ${originalIndex}`)
            }

            const date = new Date(year, month, day)
            if (isNaN(date.getTime())) {
              throw new Error(`Invalid date '${row.Date}' in row ${originalIndex}`)
            }

            // Handle special transaction types
            let processedQuantity = quantity
            let processedPrice = price
            let processedFee = fee
            let processedTotalPay = totalPay

            if (status === 'TAX-FEE' || status === 'DIVIDEND') {
              // For Tax-Fee and Dividend, quantity and price should be 0 or ignored
              // Total Fee USD is already included in Total Pay USD, so we ignore it
              processedQuantity = 0
              processedPrice = 0
              // Total Pay represents the actual amount (negative for tax fees, positive for dividends)
              processedTotalPay = status === 'TAX-FEE' ? -Math.abs(totalPay) : Math.abs(totalPay)
              processedFee = 0
            }

            return {
              symbol: (row.Symbol && row.Symbol.trim()) ? row.Symbol.trim().toUpperCase() : '',
              type: status as 'BUY' | 'SELL' | 'TAX-FEE' | 'DIVIDEND',
              quantity: processedQuantity,
              price: processedPrice,
              fee: processedFee,
              totalPay: processedTotalPay,
              date
            }
          })

          // Validate business logic: SELL quantity cannot exceed available shares
          const holdings: { [symbol: string]: number } = {}
          
          for (const transaction of transactions.sort((a, b) => a.date.getTime() - b.date.getTime())) {
            if (transaction.type === 'BUY') {
              holdings[transaction.symbol] = (holdings[transaction.symbol] || 0) + transaction.quantity
            } else if (transaction.type === 'SELL') {
              const available = holdings[transaction.symbol] || 0
              if (transaction.quantity > available) {
                throw new Error(
                  `Cannot sell ${transaction.quantity} shares of ${transaction.symbol} on ${transaction.date.toLocaleDateString()}. Only ${available} shares available.`
                )
              }
              holdings[transaction.symbol] = available - transaction.quantity
            }
          }

          resolve(transactions)
        } catch (error) {
          reject(error)
        }
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      }
    })
  })
}

/**
 * Validates CSV file before parsing
 * @param file - File object to validate
 * @throws Error if file is invalid
 */
export function validateCSVFile(file: File): void {
  if (!file) {
    throw new Error('No file selected')
  }

  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    throw new Error('Please select a CSV file')
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File size too large. Maximum size is 10MB')
  }
}
