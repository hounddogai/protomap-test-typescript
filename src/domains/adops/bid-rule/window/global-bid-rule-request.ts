import * as text from "../../../../kit/text.js";

/** Where a global bid rule request is in its life cycle. */
export type GlobalBidRuleRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global bid rule request as the bid rule team keeps it. */
export class GlobalBidRuleRequest {
  code: string;
  label: string;
  createdAt: number;
  description: string;
  currency: string;
  frequencyCap: number;
  cohort: string;
  ownerId: string;
  threshold: number;
  status: GlobalBidRuleRequestStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    description: string,
    currency: string,
    frequencyCap: number,
    cohort: string,
    ownerId: string,
    threshold: number,
    status: GlobalBidRuleRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.description = description;
    this.currency = currency;
    this.frequencyCap = frequencyCap;
    this.cohort = cohort;
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalBidRuleRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalBidRuleRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global bid rule request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global bid rule request"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.frequencyCap + this.createdAt) * 100) / 100;
  }

  copy(): GlobalBidRuleRequest {
    return new GlobalBidRuleRequest(
      this.code,
      this.label,
      this.createdAt,
      this.description,
      this.currency,
      this.frequencyCap,
      this.cohort,
      this.ownerId,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global bid rule request in status draft. */
export function newGlobalBidRuleRequest(code: string, label: string): GlobalBidRuleRequest {
  return new GlobalBidRuleRequest(code, label, 0, "", "", 0, "", "", 0, "draft");
}
