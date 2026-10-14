import * as text from "../../../../kit/text.js";

/** Where a strict reply budget is in its life cycle. */
export type StrictReplyBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a strict reply budget and its current status. */
export class StrictReplyBudget {
  code: string;
  label: string;
  region: string;
  frequencyCap: number;
  openRate: number;
  updatedAt: number;
  expiresAt: number;
  revision: number;
  status: StrictReplyBudgetStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    frequencyCap: number,
    openRate: number,
    updatedAt: number,
    expiresAt: number,
    revision: number,
    status: StrictReplyBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
    this.expiresAt = expiresAt;
    this.revision = revision;
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

  canMoveTo(next: StrictReplyBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictReplyBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reply budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"strict reply budget"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.expiresAt * this.frequencyCap * 100) / 100;
  }

  copy(): StrictReplyBudget {
    return new StrictReplyBudget(
      this.code,
      this.label,
      this.region,
      this.frequencyCap,
      this.openRate,
      this.updatedAt,
      this.expiresAt,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict reply budget in status requested. */
export function newStrictReplyBudget(code: string, label: string): StrictReplyBudget {
  return new StrictReplyBudget(code, label, "", 0, 0, 0, 0, 0, "requested");
}
