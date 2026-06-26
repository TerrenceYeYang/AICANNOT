-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceWei" TEXT,
ADD COLUMN     "publicKeyPem" TEXT,
ADD COLUMN     "cipherBody" TEXT,
ADD COLUMN     "cipherIv" TEXT,
ADD COLUMN     "cipherKey" TEXT,
ADD COLUMN     "unlockedAt" TIMESTAMP(3),
ADD COLUMN     "unlockScope" TEXT;

-- CreateTable
CREATE TABLE "AnswerUnlock" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "amountWei" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnswerUnlock_txHash_key" ON "AnswerUnlock"("txHash");

-- CreateIndex
CREATE INDEX "AnswerUnlock_answerId_idx" ON "AnswerUnlock"("answerId");

-- AddForeignKey
ALTER TABLE "AnswerUnlock" ADD CONSTRAINT "AnswerUnlock_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
