import * as text from "../../../../kit/text.js";

/** Where a primary credit bundle is in its life cycle. */
export type PrimaryCreditBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One primary credit bundle, with what the planners need to act on it. */
export class PrimaryCreditBundle {
  code: string;
  name: string;
  impressions: number;
  cohort: string;
  amount: number;
  minimum: number;
  title: string;
  summary: string;
  attempts: number;
  status: PrimaryCreditBundleStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    cohort: string,
    amount: number,
    minimum: number,
    title: string,
    summary: string,
    attempts: number,
    status: PrimaryCreditBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.cohort = cohort;
    this.amount = amount;
    this.minimum = minimum;
    this.title = title;
    this.summary = summary;
    this.attempts = attempts;
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

  canMoveTo(next: PrimaryCreditBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PrimaryCreditBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary credit bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.minimum - this.impressions) * 100) / 100;
  }

  copy(): PrimaryCreditBundle {
    return new PrimaryCreditBundle(
      this.code,
      this.name,
      this.impressions,
      this.cohort,
      this.amount,
      this.minimum,
      this.title,
      this.summary,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary credit bundle in status open. */
export function newPrimaryCreditBundle(code: string, name: string): PrimaryCreditBundle {
  return new PrimaryCreditBundle(code, name, 0, "", 0, 0, "", "", 0, "open");
}
