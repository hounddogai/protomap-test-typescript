import * as text from "../../../../kit/text.js";

/** Where a step tier is in its life cycle. */
export type StepTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One step tier, with what the planners need to act on it. */
export class StepTier {
  code: string;
  title: string;
  budget: number;
  journeyId: string;
  expiresAt: number;
  status: StepTierStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    journeyId: string,
    expiresAt: number,
    status: StepTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.journeyId = journeyId;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: StepTierStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StepTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.expiresAt + this.budget) * 100) / 100;
  }

  copy(): StepTier {
    return new StepTier(this.code, this.title, this.budget, this.journeyId, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a step tier in status open. */
export function newStepTier(code: string, title: string): StepTier {
  return new StepTier(code, title, 0, "", 0, "open");
}
