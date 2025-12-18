import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { TransactionWithPL } from '@/lib/types'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface TransactionsTableProps {
  transactions: TransactionWithPL[]
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  const formatNumber = (amount: number, decimals: number = 4) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(amount)
  }

  // Sort transactions by date (newest first for display)
  const sortedTransactions = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead className="text-right">Realized P/L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction, index) => (
              <TableRow key={`${transaction.symbol}-${transaction.date.getTime()}-${index}`}>
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell className="font-medium">{transaction.symbol}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    {transaction.type === 'BUY' ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">BUY</span>
                      </>
                    ) : transaction.type === 'SELL' ? (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                        <span className="text-red-600 font-medium">SELL</span>
                      </>
                    ) : transaction.type === 'TAX-FEE' ? (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-600 font-medium">TAX-FEE</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-600 font-medium">DIVIDEND</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(transaction.quantity)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(transaction.price)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(transaction.totalPay)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(transaction.fee)}
                </TableCell>
                <TableCell className={`text-right ${
                  transaction.realizedPL !== undefined && transaction.realizedPL >= 0 ? 'text-green-600' : 
                  transaction.realizedPL !== undefined ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {transaction.realizedPL !== undefined ? formatCurrency(transaction.realizedPL) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {transactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No transactions to display. Upload a CSV file to get started.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
