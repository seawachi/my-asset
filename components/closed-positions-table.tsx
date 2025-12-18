import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Holding } from '@/lib/types'

interface ClosedPositionsTableProps {
  closedPositions: Holding[]
}

export function ClosedPositionsTable({ closedPositions }: ClosedPositionsTableProps) {
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

  if (closedPositions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Closed Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Total Invested</TableHead>
              <TableHead className="text-right">Realized P/L</TableHead>
              <TableHead className="text-right">Total P/L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {closedPositions.map((holding, index) => (
              <TableRow key={`${holding.symbol}-closed-${index}`}>
                <TableCell className="font-medium">{holding.symbol}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(holding.totalInvested)}
                </TableCell>
                <TableCell className={`text-right ${
                  holding.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(holding.realizedPL)}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  holding.totalPL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(holding.totalPL)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
