import * as text from "../../../../kit/text.js";

/** Where a batched post override is in its life cycle. */
export type BatchedPostOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A batched post override. Its code is unique within a tenant. */
export class BatchedPostOverride {
  code: string;
  label: string;
  amount: number;
  budget: number;
  openRate: number;
  journeyId: string;
  status: BatchedPostOverrideStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    budget: number,
    openRate: number,
    journeyId: string,
    status: BatchedPostOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.budget = budget;
    this.openRate = openRate;
    this.journeyId = journeyId;
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

  canMoveTo(next: BatchedPostOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPostOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched post override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round(this.amount * this.budget * 100) / 100;
  }

  copy(): BatchedPostOverride {
    return new BatchedPostOverride(
      this.code,
      this.label,
      this.amount,
      this.budget,
      this.openRate,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched post override in status requested. */
export function newBatchedPostOverride(code: string, label: string): BatchedPostOverride {
  return new BatchedPostOverride(code, label, 0, 0, 0, "", "requested");
}
