import * as text from "../../../../kit/text.js";

/** Where a frequency plan is in its life cycle. */
export type FrequencyPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A frequency plan. Its code is unique within a tenant. */
export class FrequencyPlan {
  code: string;
  title: string;
  cohort: string;
  notes: string;
  locale: string;
  budget: number;
  ratio: number;
  status: FrequencyPlanStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    notes: string,
    locale: string,
    budget: number,
    ratio: number,
    status: FrequencyPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.notes = notes;
    this.locale = locale;
    this.budget = budget;
    this.ratio = ratio;
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

  canMoveTo(next: FrequencyPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FrequencyPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.budget - this.ratio) * 100) / 100;
  }

  copy(): FrequencyPlan {
    return new FrequencyPlan(
      this.code,
      this.title,
      this.cohort,
      this.notes,
      this.locale,
      this.budget,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a frequency plan in status draft. */
export function newFrequencyPlan(code: string, title: string): FrequencyPlan {
  return new FrequencyPlan(code, title, "", "", "", 0, 0, "draft");
}
