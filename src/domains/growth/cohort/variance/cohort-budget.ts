import * as text from "../../../../kit/text.js";

/** Where a cohort budget is in its life cycle. */
export type CohortBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a cohort budget and its current status. */
export class CohortBudget {
  code: string;
  title: string;
  sendAt: number;
  source: string;
  sequence: number;
  status: CohortBudgetStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    source: string,
    sequence: number,
    status: CohortBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.source = source;
    this.sequence = sequence;
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

  canMoveTo(next: CohortBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CohortBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.sequence + this.sendAt) * 100) / 100;
  }

  copy(): CohortBudget {
    return new CohortBudget(this.code, this.title, this.sendAt, this.source, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a cohort budget in status requested. */
export function newCohortBudget(code: string, title: string): CohortBudget {
  return new CohortBudget(code, title, 0, "", 0, "requested");
}
