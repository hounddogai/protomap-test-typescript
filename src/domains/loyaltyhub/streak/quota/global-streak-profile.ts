import * as text from "../../../../kit/text.js";

/** Where a global streak profile is in its life cycle. */
export type GlobalStreakProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** One global streak profile, with what the planners need to act on it. */
export class GlobalStreakProfile {
  code: string;
  label: string;
  currency: string;
  phone: string;
  attempts: number;
  country: string;
  reviewer: string;
  title: string;
  conversionRate: number;
  status: GlobalStreakProfileStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    phone: string,
    attempts: number,
    country: string,
    reviewer: string,
    title: string,
    conversionRate: number,
    status: GlobalStreakProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.phone = phone;
    this.attempts = attempts;
    this.country = country;
    this.reviewer = reviewer;
    this.title = title;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: GlobalStreakProfileStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalStreakProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global streak profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.conversionRate + this.attempts) * 100) / 100;
  }

  copy(): GlobalStreakProfile {
    return new GlobalStreakProfile(
      this.code,
      this.label,
      this.currency,
      this.phone,
      this.attempts,
      this.country,
      this.reviewer,
      this.title,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global streak profile in status new. */
export function newGlobalStreakProfile(code: string, label: string): GlobalStreakProfile {
  return new GlobalStreakProfile(code, label, "", "", 0, "", "", "", 0, "new");
}
