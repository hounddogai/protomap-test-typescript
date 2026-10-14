import * as text from "../../../../kit/text.js";

/** Where a fallback credit budget is in its life cycle. */
export type FallbackCreditBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback credit budget. Its code is unique within a tenant. */
export class FallbackCreditBudget {
  code: string;
  label: string;
  phone: string;
  reviewer: string;
  notes: string;
  graceDays: number;
  batchSize: number;
  conversionRate: number;
  archived: boolean;
  ratio: number;
  status: FallbackCreditBudgetStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    reviewer: string,
    notes: string,
    graceDays: number,
    batchSize: number,
    conversionRate: number,
    archived: boolean,
    ratio: number,
    status: FallbackCreditBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.reviewer = reviewer;
    this.notes = notes;
    this.graceDays = graceDays;
    this.batchSize = batchSize;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackCreditBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCreditBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback credit budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.graceDays * this.conversionRate * 100) / 100;
  }

  copy(): FallbackCreditBudget {
    return new FallbackCreditBudget(
      this.code,
      this.label,
      this.phone,
      this.reviewer,
      this.notes,
      this.graceDays,
      this.batchSize,
      this.conversionRate,
      this.archived,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback credit budget in status idle. */
export function newFallbackCreditBudget(code: string, label: string): FallbackCreditBudget {
  return new FallbackCreditBudget(code, label, "", "", "", 0, 0, 0, false, 0, "idle");
}
