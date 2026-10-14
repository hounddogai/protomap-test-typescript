/**
 * The batched journey summary records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched journey summary is in its life cycle. */
export type BatchedJourneySummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched journey summary, with what the planners need to act on it. */
export class BatchedJourneySummary {
  code: string;
  title: string;
  rate: number;
  frequencyCap: number;
  graceDays: number;
  attributes: Map<string, string>;
  status: BatchedJourneySummaryStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    frequencyCap: number,
    graceDays: number,
    attributes: Map<string, string>,
    status: BatchedJourneySummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.graceDays = graceDays;
    this.attributes = attributes;
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

  canMoveTo(next: BatchedJourneySummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedJourneySummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched journey summary ${this.code} cannot move from ${this.status} to ${next}`);
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

  adjustedValue(): number {
    return Math.round((this.frequencyCap + this.graceDays) * 100) / 100;
  }

  copy(): BatchedJourneySummary {
    return new BatchedJourneySummary(
      this.code,
      this.title,
      this.rate,
      this.frequencyCap,
      this.graceDays,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched journey summary in status planned. */
export function newBatchedJourneySummary(code: string, title: string): BatchedJourneySummary {
  return new BatchedJourneySummary(code, title, 0, 0, 0, new Map<string, string>(), "planned");
}
