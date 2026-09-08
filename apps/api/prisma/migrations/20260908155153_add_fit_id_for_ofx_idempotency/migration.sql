-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN "fitId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "fitId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_portfolioId_fitId_key" ON "Deposit"("portfolioId", "fitId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_holdingId_fitId_key" ON "Transaction"("holdingId", "fitId");

