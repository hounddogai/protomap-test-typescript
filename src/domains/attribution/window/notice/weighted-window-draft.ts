import * as text from "../../../../kit/text.js";

/** Where a weighted window draft is in its life cycle. */
export type WeightedWindowDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted window draft as the window team keeps it. */
export class WeightedWindowDraft {
  code: string;
  label: string;
  conversionRate: number;
  variant: string;
  score: number;
  status: WeightedWindowDraftStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    variant: string,
    score: number,
    status: WeightedWindowDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.variant = variant;
    this.score = score;
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

  canMoveTo(next: WeightedWindowDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WeightedWindowDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted window draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.conversionRate + this.score) * 100) / 100;
  }

  copy(): WeightedWindowDraft {
    return new WeightedWindowDraft(this.code, this.label, this.conversionRate, this.variant, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted window draft in status open. */
export function newWeightedWindowDraft(code: string, label: string): WeightedWindowDraft {
  return new WeightedWindowDraft(code, label, 0, "", 0, "open");
}
