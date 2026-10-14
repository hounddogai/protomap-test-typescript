import * as text from "../../../../kit/text.js";

/** Where a scheduled frequency claim is in its life cycle. */
export type ScheduledFrequencyClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled frequency claim as the frequency team keeps it. */
export class ScheduledFrequencyClaim {
  code: string;
  label: string;
  batchSize: number;
  ceiling: number;
  locale: string;
  status: ScheduledFrequencyClaimStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    ceiling: number,
    locale: string,
    status: ScheduledFrequencyClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.ceiling = ceiling;
    this.locale = locale;
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

  canMoveTo(next: ScheduledFrequencyClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
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

  moveTo(next: ScheduledFrequencyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled frequency claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round((this.batchSize - this.ceiling) * 100) / 100;
  }

  copy(): ScheduledFrequencyClaim {
    return new ScheduledFrequencyClaim(this.code, this.label, this.batchSize, this.ceiling, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled frequency claim in status planned. */
export function newScheduledFrequencyClaim(code: string, label: string): ScheduledFrequencyClaim {
  return new ScheduledFrequencyClaim(code, label, 0, 0, "", "planned");
}
