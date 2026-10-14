import * as text from "../../../../kit/text.js";

/** Where a retention budget is in its life cycle. */
export type RetentionBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A retention budget as the retention team keeps it. */
export class RetentionBudget {
  code: string;
  title: string;
  campaignRef: string;
  reviewer: string;
  minimum: number;
  contactEmail: string;
  cohort: string;
  status: RetentionBudgetStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    reviewer: string,
    minimum: number,
    contactEmail: string,
    cohort: string,
    status: RetentionBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.cohort = cohort;
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

  canMoveTo(next: RetentionBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): RetentionBudget {
    return new RetentionBudget(
      this.code,
      this.title,
      this.campaignRef,
      this.reviewer,
      this.minimum,
      this.contactEmail,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a retention budget in status planned. */
export function newRetentionBudget(code: string, title: string): RetentionBudget {
  return new RetentionBudget(code, title, "", "", 0, "", "", "planned");
}
