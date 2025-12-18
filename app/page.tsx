'use client'

import React, { useState } from 'react'
import { FileUpload } from '@/components/file-upload'
import { PortfolioSummaryCards } from '@/components/portfolio-summary'
import { HoldingsTable } from '@/components/holdings-table'
import { ClosedPositionsTable } from '@/components/closed-positions-table'
import { TaxDividendSummary } from '@/components/tax-dividend-summary'
import { TransactionsTable } from '@/components/transactions-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { parseCSV } from '@/lib/csv-parser'
import { calculatePortfolio } from '@/lib/calculations'
import { Holding, TransactionWithPL, PortfolioSummary } from '@/lib/types'
import { AlertTriangle, RotateCcw, Download, Upload } from 'lucide-react'

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [transactions, setTransactions] = useState<TransactionWithPL[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setFileName(file.name)

    try {
      const csvContent = await file.text()
      const parsedTransactions = await parseCSV(csvContent)
      const result = calculatePortfolio(parsedTransactions)
      
      // Flatten all transactions for the transactions table (with realized PL)
      const allTransactions: TransactionWithPL[] = []
      result.holdings.forEach(holding => {
        allTransactions.push(...holding.transactions)
      })

      // Add tax/dividend transactions that don't have realized PL calculated
      const taxDividendTransactions = parsedTransactions.filter(t => t.type === 'TAX-FEE' || t.type === 'DIVIDEND')
      const combinedTransactions = [...allTransactions, ...taxDividendTransactions]

      setHoldings(result.holdings)
      setTransactions(combinedTransactions)
      setSummary(result.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setHoldings([])
    setTransactions([])
    setSummary(null)
    setError(null)
    setFileName(null)
  }

  const downloadExampleCSV = () => {
    const csvContent = `Symbol,amount share,Price USD,Status,Total Pay USD,Total Fee USD,Date
NVDA,3,203.64,Buy,611.39,0.47,30/10/2025
RKLB,1.4573015,63,Buy,91.96,0.1500055,3/11/2025
META,1,653.5,Buy,654.04,0.54,3/11/2025
AMZN,3,243.4631,Sell,729.21,1.1793,3/11/2025
NVDA,0,0,TAX-FEE,-50,0,5/11/2025
AAPL,0,0,DIVIDEND,25,0,10/11/2025`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'example-portfolio.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const hasData = holdings.length > 0 || transactions.length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Stock Portfolio Tracker
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Calculate FIFO cost basis and portfolio performance from CSV data
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={downloadExampleCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Example CSV
            </Button>
            {hasData && (
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!hasData ? (
          <div className="max-w-2xl mx-auto">
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
            {isProcessing && (
              <div className="text-center mt-4">
                <p className="text-muted-foreground">Processing {fileName}...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {summary && <PortfolioSummaryCards summary={summary} />}
            
            {/* Separate active holdings and closed positions */}
            <div className="space-y-6">
              <HoldingsTable holdings={holdings.filter(h => h.remainingShares > 0.0001)} />
              <ClosedPositionsTable closedPositions={holdings.filter(h => h.remainingShares <= 0.0001 && h.symbol !== '')} />
              <TaxDividendSummary transactions={transactions} />
            </div>
            
            <Tabs defaultValue="transactions" className="w-full mt-8">
              <TabsList className="grid w-full grid-cols-1 max-w-md mx-auto">
                <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="transactions" className="mt-6">
                <TransactionsTable transactions={transactions} />
              </TabsContent>
            </Tabs>

            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setHoldings([])
                  setTransactions([])
                  setSummary(null)
                }}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload New File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
