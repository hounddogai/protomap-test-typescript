import * as text from "../../../../kit/text.js";

/** Where a lenient reward baseline is in its life cycle. */
export type LenientRewardBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient reward baseline. Its code is unique within a tenant. */
export class LenientRewardBaseline {
  code: string;
  label: string;
  name: string;
  variant: string;
  reviewer: string;
  graceDays: number;
  locale: string;
  threshold: number;
  createdAt: number;
  journeyId: string;
  expiresAt: number;
  status: LenientRewardBaselineStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    variant: string,
    reviewer: string,
    graceDays: number,
    locale: string,
    threshold: number,
    createdAt: number,
    journeyId: string,
    expiresAt: number,
    status: LenientRewardBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.variant = variant;
    this.reviewer = reviewer;
    this.graceDays = graceDays;
    this.locale = locale;
    this.threshold = threshold;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: LenientRewardBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientRewardBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.threshold - this.expiresAt) * 100) / 100;
  }

  copy(): LenientRewardBaseline {
    return new LenientRewardBaseline(
      this.code,
      this.label,
      this.name,
      this.variant,
      this.reviewer,
      this.graceDays,
      this.locale,
      this.threshold,
      this.createdAt,
      this.journeyId,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient reward baseline in status planned. */
export function newLenientRewardBaseline(code: string, label: string): LenientRewardBaseline {
  return new LenientRewardBaseline(code, label, "", "", "", 0, "", 0, 0, "", 0, "planned");
}
