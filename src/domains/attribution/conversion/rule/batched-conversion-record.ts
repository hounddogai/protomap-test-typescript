import * as text from "../../../../kit/text.js";

/** Where a batched conversion record is in its life cycle. */
export type BatchedConversionRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** A batched conversion record. Its code is unique within a tenant. */
export class BatchedConversionRecord {
  code: string;
  label: string;
  version: number;
  ratio: number;
  expiresAt: number;
  maximum: number;
  journeyId: string;
  amount: number;
  limit: number;
  reviewer: string;
  status: BatchedConversionRecordStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    ratio: number,
    expiresAt: number,
    maximum: number,
    journeyId: string,
    amount: number,
    limit: number,
    reviewer: string,
    status: BatchedConversionRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.maximum = maximum;
    this.journeyId = journeyId;
    this.amount = amount;
    this.limit = limit;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedConversionRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedConversionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched conversion record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"batched conversion record"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.ratio + this.limit) * 100) / 100;
  }

  copy(): BatchedConversionRecord {
    return new BatchedConversionRecord(
      this.code,
      this.label,
      this.version,
      this.ratio,
      this.expiresAt,
      this.maximum,
      this.journeyId,
      this.amount,
      this.limit,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched conversion record in status requested. */
export function newBatchedConversionRecord(code: string, label: string): BatchedConversionRecord {
  return new BatchedConversionRecord(code, label, 0, 0, 0, 0, "", 0, 0, "", "requested");
}
