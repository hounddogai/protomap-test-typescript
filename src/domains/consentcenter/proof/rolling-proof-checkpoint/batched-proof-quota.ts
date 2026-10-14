import * as text from "../../../../kit/text.js";

/** Where a batched proof quota is in its life cycle. */
export type BatchedProofQuotaStatus = "created" | "validated" | "published" | "retired";

/** A batched proof quota. Its code is unique within a tenant. */
export class BatchedProofQuota {
  code: string;
  label: string;
  version: number;
  windowDays: number;
  quantity: number;
  locale: string;
  campaignRef: string;
  status: BatchedProofQuotaStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    windowDays: number,
    quantity: number,
    locale: string,
    campaignRef: string,
    status: BatchedProofQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedProofQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedProofQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched proof quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round((this.windowDays - this.version) * 100) / 100;
  }

  copy(): BatchedProofQuota {
    return new BatchedProofQuota(
      this.code,
      this.label,
      this.version,
      this.windowDays,
      this.quantity,
      this.locale,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched proof quota in status created. */
export function newBatchedProofQuota(code: string, label: string): BatchedProofQuota {
  return new BatchedProofQuota(code, label, 0, 0, 0, "", "", "created");
}
