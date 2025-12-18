import { Transaction, Lot, Holding, PortfolioSummary, TransactionWithPL } from './types'

/**
 * FIFO Cost-Basis Calculator
 * 
 * This module implements First-In-First-Out (FIFO) cost basis calculation for stock portfolios.
 * 
 * Key Concepts:
 * - Lots: Groups of shares bought at the same price and time
 * - FIFO: When selling shares, the oldest lots are sold first
 * - Cost Basis: The original purchase price of shares
 * - Realized P/L: Profit/loss from completed (sold) positions
 * - Unrealized P/L: Profit/loss from still-held positions
 */

/**
 * Calculates realized P/L for a sell transaction using FIFO
 * Formula: (realSellPrice - lotCost) * soldQuantity - proportionalFees
 * 
 * @param sellPrice - Price per share for the sell transaction
 * @param lotCost - Cost per share for the lot being sold
 * @param quantity - Number of shares sold
 * @param sellFee - Fee for the sell transaction
 * @param lotTotalFee - Fee for the original buy transaction of this lot
 * @returns Realized profit/loss
 */
export function calculateRealizedPL(
  sellPrice: number,
  lotCost: number,
  quantity: number,
  sellFee: number,
  lotTotalFee: number
): number {
  const revenue = sellPrice * quantity
  const cost = lotCost * quantity
  const proportionalBuyFee = (lotTotalFee / (lotCost * quantity)) * revenue // Proportional fee allocation
  const proportionalSellFee = sellFee // Include sell fee directly
  
  // Realized P/L with buy and sell fees
  return revenue - cost - proportionalBuyFee - proportionalSellFee
}

/**
 * Processes transactions for a single symbol using FIFO
 * 
 * @param transactions - Array of transactions for one symbol, sorted by date
 * @returns Holding information with calculated metrics
 */
export function processSymbolTransactions(transactions: Transaction[]): Holding {
  if (transactions.length === 0) {
    throw new Error('No transactions provided')
  }

  // FIFO queue of lots (oldest first)
  const lots: Lot[] = []
  let totalInvested = 0
  let totalRealizedPL = 0
  const transactionsWithPL: TransactionWithPL[] = []

  for (const transaction of transactions) {
    if (transaction.type === 'BUY') {
      // Create a new lot for this purchase
      const newLot: Lot = {
        remainingQty: transaction.quantity,
        costPerShare: transaction.price
      }
      lots.push(newLot)
      totalInvested += transaction.totalPay
      transactionsWithPL.push(transaction)
      
    } else if (transaction.type === 'SELL') {
      // Process sell using FIFO - consume from oldest lots first
      let remainingSellQty = transaction.quantity
      
      while (remainingSellQty > 0) {
        if (lots.length === 0) {
          throw new Error('Insufficient shares available for sale')
        }
        
        const currentLot = lots[0] // Oldest lot (FIFO)
        
        if (currentLot.remainingQty <= remainingSellQty) {
          // Sell entire lot
          const soldQty = currentLot.remainingQty
          const realizedPL = calculateRealizedPL(
            transaction.price,
            currentLot.costPerShare,
            soldQty,
            transaction.fee,
            0 // We don't track individual lot fees in this implementation
          )
          
          totalRealizedPL += realizedPL
          remainingSellQty -= soldQty
          lots.shift() // Remove the consumed lot
          
        } else {
          // Partial lot consumption
          const realizedPL = calculateRealizedPL(
            transaction.price,
            currentLot.costPerShare,
            remainingSellQty,
            transaction.fee,
            0 // We don't track individual lot fees in this implementation
          )
          
          totalRealizedPL += realizedPL
          currentLot.remainingQty -= remainingSellQty
          remainingSellQty = 0
        }
      }
      
      transactionsWithPL.push({
        ...transaction,
        realizedPL: totalRealizedPL // Track cumulative realized PL for this symbol
      })
    } else if (transaction.type === 'TAX-FEE' || transaction.type === 'DIVIDEND') {
      // Tax fees and dividends affect P/L directly
      // Total Pay is negative for tax fees, positive for dividends
      totalRealizedPL += transaction.totalPay
      transactionsWithPL.push({
        ...transaction,
        realizedPL: totalRealizedPL
      })
    }
  }

  // Calculate remaining shares and average cost
  const remainingShares = lots.reduce((sum, lot) => sum + lot.remainingQty, 0)
  const averageCost = remainingShares > 0 
    ? lots.reduce((sum, lot) => sum + (lot.remainingQty * lot.costPerShare), 0) / remainingShares
    : 0

  // Calculate unrealized P/L (using last buy price as current price)
  // Note: In a real application, this would use current market prices
  const lastBuyPrice = transactions
    .filter(t => t.type === 'BUY')
    .slice(-1)[0]?.price || 0
  
  const unrealizedPL = (lastBuyPrice - averageCost) * remainingShares

  return {
    symbol: transactions[0].symbol,
    remainingShares,
    averageCost,
    realizedPL: totalRealizedPL,
    unrealizedPL,
    totalPL: totalRealizedPL + unrealizedPL,
    totalInvested,
    transactions: transactionsWithPL
  }
}

/**
 * Groups transactions by symbol and processes each group
 * 
 * @param transactions - All transactions from the portfolio
 * @returns Array of holdings, one per symbol
 */
export function calculateHoldings(transactions: Transaction[]): Holding[] {
  // Group transactions by symbol, but exclude TAX-FEE and DIVIDEND from holdings
  const transactionsBySymbol: { [symbol: string]: Transaction[] } = {}
  
  for (const transaction of transactions) {
    // Skip TAX-FEE and DIVIDEND transactions for holdings calculation
    if (transaction.type === 'TAX-FEE' || transaction.type === 'DIVIDEND') {
      continue
    }
    
    if (!transactionsBySymbol[transaction.symbol]) {
      transactionsBySymbol[transaction.symbol] = []
    }
    transactionsBySymbol[transaction.symbol].push(transaction)
  }

  // Process each symbol's transactions
  const holdings: Holding[] = []
  
  for (const symbol in transactionsBySymbol) {
    const symbolTransactions = transactionsBySymbol[symbol]
      .sort((a, b) => a.date.getTime() - b.date.getTime()) // Sort by date ascending
    
    try {
      const holding = processSymbolTransactions(symbolTransactions)
      holdings.push(holding)
    } catch (error) {
      throw new Error(`Error processing ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return holdings
}

/**
 * Calculates portfolio summary metrics
 * 
 * @param holdings - Array of all holdings
 * @returns Portfolio summary with aggregate metrics
 */
export function calculatePortfolioSummary(holdings: Holding[]): PortfolioSummary {
  const totalInvested = holdings.reduce((sum, holding) => sum + holding.totalInvested, 0)
  const totalRealizedPL = holdings.reduce((sum, holding) => sum + holding.realizedPL, 0)
  const totalUnrealizedPL = holdings.reduce((sum, holding) => sum + holding.unrealizedPL, 0)
  const cumulativePL = totalRealizedPL + totalUnrealizedPL

  return {
    totalInvested,
    totalRealizedPL,
    totalUnrealizedPL,
    cumulativePL
  }
}

/**
 * Main calculation function - processes all transactions and returns complete results
 * 
 * @param transactions - All transactions from CSV
 * @returns Object with holdings and portfolio summary
 */
export function calculatePortfolio(transactions: Transaction[]): {
  holdings: Holding[]
  summary: PortfolioSummary
} {
  const holdings = calculateHoldings(transactions)
  const summary = calculatePortfolioSummary(holdings)
  
  return { holdings, summary }
}
