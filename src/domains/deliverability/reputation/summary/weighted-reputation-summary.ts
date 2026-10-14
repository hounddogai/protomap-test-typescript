/**
 * The weighted reputation summary records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reputation summary is in its life cycle. */
export type WeightedReputationSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted reputation summary as the reputation team keeps it. */
export class WeightedReputationSummary {
  code: string;
  name: string;
  priority: number;
  notes: string;
  timezone: string;
  utmSource: string;
  ratio: number;
  cost: number;
  segment: string;
  status: WeightedReputationSummaryStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    notes: string,
    timezone: string,
    utmSource: string,
    ratio: number,
    cost: number,
    segment: string,
    status: WeightedReputationSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.notes = notes;
    this.timezone = timezone;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.cost = cost;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedReputationSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WeightedReputationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reputation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted reputation summary"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.priority * this.cost * 100) / 100;
  }

  copy(): WeightedReputationSummary {
    return new WeightedReputationSummary(
      this.code,
      this.name,
      this.priority,
      this.notes,
      this.timezone,
      this.utmSource,
      this.ratio,
      this.cost,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a weighted reputation summary in status requested. */
export function newWeightedReputationSummary(code: string, name: string): WeightedReputationSummary {
  return new WeightedReputationSummary(code, name, 0, "", "", "", 0, 0, "", "requested");
}
