/**
 * The weighted reputation draft records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reputation draft is in its life cycle. */
export type WeightedReputationDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One weighted reputation draft, with what the planners need to act on it. */
export class WeightedReputationDraft {
  code: string;
  name: string;
  cohort: string;
  budget: number;
  locale: string;
  ratio: number;
  sequence: number;
  summary: string;
  windowDays: number;
  variant: string;
  status: WeightedReputationDraftStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    budget: number,
    locale: string,
    ratio: number,
    sequence: number,
    summary: string,
    windowDays: number,
    variant: string,
    status: WeightedReputationDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.budget = budget;
    this.locale = locale;
    this.ratio = ratio;
    this.sequence = sequence;
    this.summary = summary;
    this.windowDays = windowDays;
    this.variant = variant;
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

  canMoveTo(next: WeightedReputationDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedReputationDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reputation draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round(this.ratio * this.windowDays * 100) / 100;
  }

  copy(): WeightedReputationDraft {
    return new WeightedReputationDraft(
      this.code,
      this.name,
      this.cohort,
      this.budget,
      this.locale,
      this.ratio,
      this.sequence,
      this.summary,
      this.windowDays,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted reputation draft in status open. */
export function newWeightedReputationDraft(code: string, name: string): WeightedReputationDraft {
  return new WeightedReputationDraft(code, name, "", 0, "", 0, 0, "", 0, "", "open");
}
