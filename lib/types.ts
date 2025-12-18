// Transaction model from CSV data
export type Transaction = {
  symbol: string
  type: "BUY" | "SELL" | "TAX-FEE" | "DIVIDEND"
  quantity: number
  price: number
  fee: number
  totalPay: number
  date: Date
}

// Internal FIFO lot tracking
export type Lot = {
  remainingQty: number
  costPerShare: number
}

// Portfolio holdings per symbol
export type Holding = {
  symbol: string
  remainingShares: number
  averageCost: number
  realizedPL: number
  unrealizedPL: number
  totalPL: number
  totalInvested: number
  transactions: Transaction[]
}

// Portfolio summary
export type PortfolioSummary = {
  totalInvested: number
  totalRealizedPL: number
  totalUnrealizedPL: number
  cumulativePL: number
}

// CSV row type (raw data from file)
export type CSVRow = {
  Symbol: string
  "amount share": string
  "Price USD": string
  Status: string
  "Total Pay USD": string
  "Total Fee USD": string
  Date: string
}

// Parsed transaction with calculated realized P/L (for SELL transactions)
export type TransactionWithPL = Transaction & {
  realizedPL?: number
}
