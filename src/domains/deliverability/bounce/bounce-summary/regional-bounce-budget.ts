import * as text from "../../../../kit/text.js";

/** Where a regional bounce budget is in its life cycle. */
export type RegionalBounceBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional bounce budget as the bounce team keeps it. */
export class RegionalBounceBudget {
  code: string;
  label: string;
  sequence: number;
  openRate: number;
  batchSize: number;
  source: string;
  margin: number;
  cohort: string;
  updatedAt: number;
  status: RegionalBounceBudgetStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    openRate: number,
    batchSize: number,
    source: string,
    margin: number,
    cohort: string,
    updatedAt: number,
    status: RegionalBounceBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.openRate = openRate;
    this.batchSize = batchSize;
    this.source = source;
    this.margin = margin;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalBounceBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalBounceBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional bounce budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.margin + this.openRate) * 100) / 100;
  }

  copy(): RegionalBounceBudget {
    return new RegionalBounceBudget(
      this.code,
      this.label,
      this.sequence,
      this.openRate,
      this.batchSize,
      this.source,
      this.margin,
      this.cohort,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional bounce budget in status planned. */
export function newRegionalBounceBudget(code: string, label: string): RegionalBounceBudget {
  return new RegionalBounceBudget(code, label, 0, 0, 0, "", 0, "", 0, "planned");
}
