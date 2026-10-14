/**
 * The strict post summary records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict post summary is in its life cycle. */
export type StrictPostSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A strict post summary as the post team keeps it. */
export class StrictPostSummary {
  code: string;
  title: string;
  unit: string;
  discount: number;
  channel: string;
  cost: number;
  frequencyCap: number;
  durationMinutes: number;
  utmSource: string;
  status: StrictPostSummaryStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    discount: number,
    channel: string,
    cost: number,
    frequencyCap: number,
    durationMinutes: number,
    utmSource: string,
    status: StrictPostSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.discount = discount;
    this.channel = channel;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
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

  canMoveTo(next: StrictPostSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
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

  moveTo(next: StrictPostSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict post summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.durationMinutes + this.frequencyCap) * 100) / 100;
  }

  copy(): StrictPostSummary {
    return new StrictPostSummary(
      this.code,
      this.title,
      this.unit,
      this.discount,
      this.channel,
      this.cost,
      this.frequencyCap,
      this.durationMinutes,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict post summary in status draft. */
export function newStrictPostSummary(code: string, title: string): StrictPostSummary {
  return new StrictPostSummary(code, title, "", 0, "", 0, 0, 0, "", "draft");
}
