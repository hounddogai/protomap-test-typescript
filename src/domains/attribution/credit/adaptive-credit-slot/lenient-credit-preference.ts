import * as text from "../../../../kit/text.js";

/** Where a lenient credit preference is in its life cycle. */
export type LenientCreditPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient credit preference as the credit team keeps it. */
export class LenientCreditPreference {
  code: string;
  title: string;
  frequencyCap: number;
  budget: number;
  summary: string;
  contactEmail: string;
  conversionRate: number;
  attempts: number;
  variant: string;
  status: LenientCreditPreferenceStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    budget: number,
    summary: string,
    contactEmail: string,
    conversionRate: number,
    attempts: number,
    variant: string,
    status: LenientCreditPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.summary = summary;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
    this.attempts = attempts;
    this.variant = variant;
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

  canMoveTo(next: LenientCreditPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientCreditPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient credit preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round(this.attempts * this.budget * 100) / 100;
  }

  copy(): LenientCreditPreference {
    return new LenientCreditPreference(
      this.code,
      this.title,
      this.frequencyCap,
      this.budget,
      this.summary,
      this.contactEmail,
      this.conversionRate,
      this.attempts,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient credit preference in status new. */
export function newLenientCreditPreference(code: string, title: string): LenientCreditPreference {
  return new LenientCreditPreference(code, title, 0, 0, "", "", 0, 0, "", "new");
}
