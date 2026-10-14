import * as text from "../../../../kit/text.js";

/** Where a suppression quota is in its life cycle. */
export type SuppressionQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A suppression quota. Its code is unique within a tenant. */
export class SuppressionQuota {
  code: string;
  label: string;
  cost: number;
  expiresAt: number;
  campaignRef: string;
  status: SuppressionQuotaStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    expiresAt: number,
    campaignRef: string,
    status: SuppressionQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SuppressionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.cost - this.expiresAt) * 100) / 100;
  }

  copy(): SuppressionQuota {
    return new SuppressionQuota(this.code, this.label, this.cost, this.expiresAt, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression quota in status new. */
export function newSuppressionQuota(code: string, label: string): SuppressionQuota {
  return new SuppressionQuota(code, label, 0, 0, "", "new");
}
