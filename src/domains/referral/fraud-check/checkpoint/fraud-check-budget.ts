import * as text from "../../../../kit/text.js";

/** Where a fraud check budget is in its life cycle. */
export type FraudCheckBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fraud check budget. Its code is unique within a tenant. */
export class FraudCheckBudget {
  code: string;
  label: string;
  rate: number;
  notes: string;
  durationMinutes: number;
  attempts: number;
  journeyId: string;
  status: FraudCheckBudgetStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    notes: string,
    durationMinutes: number,
    attempts: number,
    journeyId: string,
    status: FraudCheckBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.journeyId = journeyId;
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

  canMoveTo(next: FraudCheckBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "cancelled":
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

  moveTo(next: FraudCheckBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round(this.durationMinutes * this.attempts * 100) / 100;
  }

  copy(): FraudCheckBudget {
    return new FraudCheckBudget(
      this.code,
      this.label,
      this.rate,
      this.notes,
      this.durationMinutes,
      this.attempts,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check budget in status planned. */
export function newFraudCheckBudget(code: string, label: string): FraudCheckBudget {
  return new FraudCheckBudget(code, label, 0, "", 0, 0, "", "planned");
}
