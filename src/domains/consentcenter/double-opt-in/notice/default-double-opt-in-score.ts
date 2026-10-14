import * as text from "../../../../kit/text.js";

/** Where a default double opt in score is in its life cycle. */
export type DefaultDoubleOptInScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a default double opt in score and its current status. */
export class DefaultDoubleOptInScore {
  code: string;
  title: string;
  cohort: string;
  ceiling: number;
  openRate: number;
  category: string;
  status: DefaultDoubleOptInScoreStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    ceiling: number,
    openRate: number,
    category: string,
    status: DefaultDoubleOptInScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.ceiling = ceiling;
    this.openRate = openRate;
    this.category = category;
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

  canMoveTo(next: DefaultDoubleOptInScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: DefaultDoubleOptInScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default double opt in score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round(this.ceiling * this.openRate * 100) / 100;
  }

  copy(): DefaultDoubleOptInScore {
    return new DefaultDoubleOptInScore(
      this.code,
      this.title,
      this.cohort,
      this.ceiling,
      this.openRate,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a default double opt in score in status planned. */
export function newDefaultDoubleOptInScore(code: string, title: string): DefaultDoubleOptInScore {
  return new DefaultDoubleOptInScore(code, title, "", 0, 0, "", "planned");
}
