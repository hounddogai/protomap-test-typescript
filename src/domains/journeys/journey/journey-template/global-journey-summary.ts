import * as text from "../../../../kit/text.js";

/** Where a global journey summary is in its life cycle. */
export type GlobalJourneySummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a global journey summary and its current status. */
export class GlobalJourneySummary {
  code: string;
  title: string;
  windowDays: number;
  amount: number;
  description: string;
  source: string;
  audienceId: string;
  score: number;
  durationMinutes: number;
  attributes: Map<string, string>;
  threshold: number;
  status: GlobalJourneySummaryStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    amount: number,
    description: string,
    source: string,
    audienceId: string,
    score: number,
    durationMinutes: number,
    attributes: Map<string, string>,
    threshold: number,
    status: GlobalJourneySummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.amount = amount;
    this.description = description;
    this.source = source;
    this.audienceId = audienceId;
    this.score = score;
    this.durationMinutes = durationMinutes;
    this.attributes = attributes;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalJourneySummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalJourneySummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global journey summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.threshold - this.windowDays) * 100) / 100;
  }

  copy(): GlobalJourneySummary {
    return new GlobalJourneySummary(
      this.code,
      this.title,
      this.windowDays,
      this.amount,
      this.description,
      this.source,
      this.audienceId,
      this.score,
      this.durationMinutes,
      this.attributes,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global journey summary in status proposed. */
export function newGlobalJourneySummary(code: string, title: string): GlobalJourneySummary {
  return new GlobalJourneySummary(code, title, 0, 0, "", "", "", 0, 0, new Map<string, string>(), 0, "proposed");
}
