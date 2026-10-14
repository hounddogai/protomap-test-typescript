import * as text from "../../../../kit/text.js";

/** Where a pending journey rollup is in its life cycle. */
export type PendingJourneyRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending journey rollup and its current status. */
export class PendingJourneyRollup {
  code: string;
  name: string;
  startsAt: number;
  attributes: Map<string, string>;
  reviewer: string;
  unit: string;
  category: string;
  createdAt: number;
  locale: string;
  budget: number;
  rate: number;
  status: PendingJourneyRollupStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    attributes: Map<string, string>,
    reviewer: string,
    unit: string,
    category: string,
    createdAt: number,
    locale: string,
    budget: number,
    rate: number,
    status: PendingJourneyRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.attributes = attributes;
    this.reviewer = reviewer;
    this.unit = unit;
    this.category = category;
    this.createdAt = createdAt;
    this.locale = locale;
    this.budget = budget;
    this.rate = rate;
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

  canMoveTo(next: PendingJourneyRollupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: PendingJourneyRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending journey rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round(this.createdAt * this.budget * 100) / 100;
  }

  copy(): PendingJourneyRollup {
    return new PendingJourneyRollup(
      this.code,
      this.name,
      this.startsAt,
      this.attributes,
      this.reviewer,
      this.unit,
      this.category,
      this.createdAt,
      this.locale,
      this.budget,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending journey rollup in status open. */
export function newPendingJourneyRollup(code: string, name: string): PendingJourneyRollup {
  return new PendingJourneyRollup(code, name, 0, new Map<string, string>(), "", "", "", 0, "", 0, 0, "open");
}
