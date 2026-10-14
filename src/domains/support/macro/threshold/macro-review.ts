import * as text from "../../../../kit/text.js";

/** Where a macro review is in its life cycle. */
export type MacroReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a macro review and its current status. */
export class MacroReview {
  code: string;
  label: string;
  threshold: number;
  ownerId: string;
  conversionRate: number;
  country: string;
  journeyId: string;
  maximum: number;
  status: MacroReviewStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    ownerId: string,
    conversionRate: number,
    country: string,
    journeyId: string,
    maximum: number,
    status: MacroReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.ownerId = ownerId;
    this.conversionRate = conversionRate;
    this.country = country;
    this.journeyId = journeyId;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.conversionRate + this.maximum) * 100) / 100;
  }

  copy(): MacroReview {
    return new MacroReview(
      this.code,
      this.label,
      this.threshold,
      this.ownerId,
      this.conversionRate,
      this.country,
      this.journeyId,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a macro review in status new. */
export function newMacroReview(code: string, label: string): MacroReview {
  return new MacroReview(code, label, 0, "", 0, "", "", 0, "new");
}
