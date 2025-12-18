import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Holding } from '@/lib/types'

interface HoldingsTableProps {
  holdings: Holding[]
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatNumber = (amount: number, decimals: number = 4) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(amount)
  }

  const getTotalValue = (holding: Holding) => {
    // For demonstration, using last buy price as current price
    // In a real app, this would use current market data
    const lastBuyPrice = holding.transactions
      .filter(t => t.type === 'BUY')
      .slice(-1)[0]?.price || holding.averageCost
    
    return holding.remainingShares * lastBuyPrice
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Avg Cost</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Realized P/L</TableHead>
              <TableHead className="text-right">Unrealized P/L</TableHead>
              <TableHead className="text-right">Total P/L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              const currentValue = getTotalValue(holding)
              const totalPL = holding.realizedPL + holding.unrealizedPL
              
              return (
                <TableRow key={holding.symbol}>
                  <TableCell className="font-medium">{holding.symbol}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(holding.remainingShares)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(holding.averageCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(currentValue)}
                  </TableCell>
                  <TableCell className={`text-right ${
                    holding.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(holding.realizedPL)}
                  </TableCell>
                  <TableCell className={`text-right ${
                    holding.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(holding.unrealizedPL)}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${
                    totalPL >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(totalPL)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        
        {holdings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No holdings to display. Upload a CSV file to get started.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
