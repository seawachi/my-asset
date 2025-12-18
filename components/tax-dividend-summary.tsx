import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Transaction } from '@/lib/types'

interface TaxDividendSummaryProps {
  transactions: Transaction[]
}

export function TaxDividendSummary({ transactions }: TaxDividendSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Filter tax fees and dividends
  const taxFees = transactions.filter(t => t.type === 'TAX-FEE')
  const dividends = transactions.filter(t => t.type === 'DIVIDEND')

  if (taxFees.length === 0 && dividends.length === 0) {
    return null
  }

  const totalTaxFees = taxFees.reduce((sum, t) => sum + Math.abs(t.totalPay), 0)
  const totalDividends = dividends.reduce((sum, t) => sum + t.totalPay, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax & Dividend Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Total Tax Fees</div>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(totalTaxFees)}
            </div>
            {taxFees.map((fee, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                {fee.symbol || 'General'}: -{formatCurrency(Math.abs(fee.totalPay))} ({fee.date.toLocaleDateString()})
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Total Dividends</div>
            <div className="text-2xl font-bold text-green-600">
              +{formatCurrency(totalDividends)}
            </div>
            {dividends.map((dividend, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                {dividend.symbol || 'General'}: +{formatCurrency(dividend.totalPay)} ({dividend.date.toLocaleDateString()})
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
