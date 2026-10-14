import * as text from "../../../../kit/text.js";

/** Where a retention summary is in its life cycle. */
export type RetentionSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One retention summary, with what the planners need to act on it. */
export class RetentionSummary {
  code: string;
  name: string;
  budget: number;
  summary: string;
  locale: string;
  description: string;
  notes: string;
  currency: string;
  updatedAt: number;
  sequence: number;
  status: RetentionSummaryStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    summary: string,
    locale: string,
    description: string,
    notes: string,
    currency: string,
    updatedAt: number,
    sequence: number,
    status: RetentionSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.summary = summary;
    this.locale = locale;
    this.description = description;
    this.notes = notes;
    this.currency = currency;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RetentionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.updatedAt + this.budget) * 100) / 100;
  }

  copy(): RetentionSummary {
    return new RetentionSummary(
      this.code,
      this.name,
      this.budget,
      this.summary,
      this.locale,
      this.description,
      this.notes,
      this.currency,
      this.updatedAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a retention summary in status draft. */
export function newRetentionSummary(code: string, name: string): RetentionSummary {
  return new RetentionSummary(code, name, 0, "", "", "", "", "", 0, 0, "draft");
}
