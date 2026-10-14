import * as text from "../../../../kit/text.js";

/** Where a suppression budget is in its life cycle. */
export type SuppressionBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One suppression budget, with what the planners need to act on it. */
export class SuppressionBudget {
  code: string;
  label: string;
  sequence: number;
  budget: number;
  segment: string;
  country: string;
  checksum: string;
  contactEmail: string;
  status: SuppressionBudgetStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    budget: number,
    segment: string,
    country: string,
    checksum: string,
    contactEmail: string,
    status: SuppressionBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.budget = budget;
    this.segment = segment;
    this.country = country;
    this.checksum = checksum;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.budget - this.sequence) * 100) / 100;
  }

  copy(): SuppressionBudget {
    return new SuppressionBudget(
      this.code,
      this.label,
      this.sequence,
      this.budget,
      this.segment,
      this.country,
      this.checksum,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a suppression budget in status open. */
export function newSuppressionBudget(code: string, label: string): SuppressionBudget {
  return new SuppressionBudget(code, label, 0, 0, "", "", "", "", "open");
}
