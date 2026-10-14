import * as text from "../../../../kit/text.js";

/** Where a fraud check baseline is in its life cycle. */
export type FraudCheckBaselineStatus = "created" | "validated" | "published" | "retired";

/** A fraud check baseline as the fraud check team keeps it. */
export class FraudCheckBaseline {
  code: string;
  label: string;
  budget: number;
  notes: string;
  openRate: number;
  status: FraudCheckBaselineStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    notes: string,
    openRate: number,
    status: FraudCheckBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.notes = notes;
    this.openRate = openRate;
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

  canMoveTo(next: FraudCheckBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.budget + this.openRate) * 100) / 100;
  }

  copy(): FraudCheckBaseline {
    return new FraudCheckBaseline(this.code, this.label, this.budget, this.notes, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check baseline in status created. */
export function newFraudCheckBaseline(code: string, label: string): FraudCheckBaseline {
  return new FraudCheckBaseline(code, label, 0, "", 0, "created");
}
