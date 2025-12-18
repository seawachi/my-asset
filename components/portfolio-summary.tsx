import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { PortfolioSummary } from '@/lib/types'
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'

interface PortfolioSummaryProps {
  summary: PortfolioSummary
}

export function PortfolioSummaryCards({ summary }: PortfolioSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (amount: number) => {
    return `${amount >= 0 ? '+' : ''}${amount.toFixed(2)}%`
  }

  const returnOnInvestment = summary.totalInvested > 0 
    ? (summary.cumulativePL / summary.totalInvested) * 100 
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalInvested)}</div>
          <p className="text-xs text-muted-foreground">
            Total capital deployed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Realized P/L</CardTitle>
          {summary.totalRealizedPL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            summary.totalRealizedPL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(summary.totalRealizedPL)}
          </div>
          <p className="text-xs text-muted-foreground">
            From closed positions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unrealized P/L</CardTitle>
          {summary.totalUnrealizedPL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            summary.totalUnrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(summary.totalUnrealizedPL)}
          </div>
          <p className="text-xs text-muted-foreground">
            From open positions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total P/L</CardTitle>
          {summary.cumulativePL >= 0 ? (
            <DollarSign className="h-4 w-4 text-green-600" />
          ) : (
            <DollarSign className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            summary.cumulativePL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(summary.cumulativePL)}
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-xs text-muted-foreground">
              ROI: 
            </p>
            <span className={`text-xs font-medium ${
              returnOnInvestment >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(returnOnInvestment)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
