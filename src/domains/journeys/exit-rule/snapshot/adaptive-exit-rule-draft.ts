import * as text from "../../../../kit/text.js";

/** Where a adaptive exit rule draft is in its life cycle. */
export type AdaptiveExitRuleDraftStatus = "created" | "validated" | "published" | "retired";

/** One adaptive exit rule draft, with what the planners need to act on it. */
export class AdaptiveExitRuleDraft {
  code: string;
  name: string;
  locale: string;
  frequencyCap: number;
  phone: string;
  priority: number;
  cohort: string;
  source: string;
  status: AdaptiveExitRuleDraftStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    frequencyCap: number,
    phone: string,
    priority: number,
    cohort: string,
    source: string,
    status: AdaptiveExitRuleDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.priority = priority;
    this.cohort = cohort;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveExitRuleDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveExitRuleDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive exit rule draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.priority - this.frequencyCap) * 100) / 100;
  }

  copy(): AdaptiveExitRuleDraft {
    return new AdaptiveExitRuleDraft(
      this.code,
      this.name,
      this.locale,
      this.frequencyCap,
      this.phone,
      this.priority,
      this.cohort,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive exit rule draft in status created. */
export function newAdaptiveExitRuleDraft(code: string, name: string): AdaptiveExitRuleDraft {
  return new AdaptiveExitRuleDraft(code, name, "", 0, "", 0, "", "", "created");
}
