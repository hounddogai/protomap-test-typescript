import * as text from "../../../../kit/text.js";

/** Where a strict insight rollup is in its life cycle. */
export type StrictInsightRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict insight rollup as the insight team keeps it. */
export class StrictInsightRollup {
  code: string;
  label: string;
  locale: string;
  graceDays: number;
  audienceId: string;
  attempts: number;
  currency: string;
  batchSize: number;
  budget: number;
  status: StrictInsightRollupStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    graceDays: number,
    audienceId: string,
    attempts: number,
    currency: string,
    batchSize: number,
    budget: number,
    status: StrictInsightRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.graceDays = graceDays;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.currency = currency;
    this.batchSize = batchSize;
    this.budget = budget;
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

  canMoveTo(next: StrictInsightRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictInsightRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict insight rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.budget + this.graceDays) * 100) / 100;
  }

  copy(): StrictInsightRollup {
    return new StrictInsightRollup(
      this.code,
      this.label,
      this.locale,
      this.graceDays,
      this.audienceId,
      this.attempts,
      this.currency,
      this.batchSize,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict insight rollup in status planned. */
export function newStrictInsightRollup(code: string, label: string): StrictInsightRollup {
  return new StrictInsightRollup(code, label, "", 0, "", 0, "", 0, 0, "planned");
}
