-- CreateTable
CREATE TABLE "DealCollaborator" (
    "id" SERIAL NOT NULL,
    "dealId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealCollaborator_dealId_idx" ON "DealCollaborator"("dealId");

-- CreateIndex
CREATE INDEX "DealCollaborator_userId_idx" ON "DealCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DealCollaborator_dealId_userId_key" ON "DealCollaborator"("dealId", "userId");

-- AddForeignKey
ALTER TABLE "DealCollaborator" ADD CONSTRAINT "DealCollaborator_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealCollaborator" ADD CONSTRAINT "DealCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
