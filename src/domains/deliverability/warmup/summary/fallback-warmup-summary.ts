/**
 * The fallback warmup summary records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback warmup summary is in its life cycle. */
export type FallbackWarmupSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback warmup summary as the warmup team keeps it. */
export class FallbackWarmupSummary {
  code: string;
  name: string;
  revision: number;
  campaignRef: string;
  discount: number;
  summary: string;
  channel: string;
  cohort: string;
  graceDays: number;
  status: FallbackWarmupSummaryStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    campaignRef: string,
    discount: number,
    summary: string,
    channel: string,
    cohort: string,
    graceDays: number,
    status: FallbackWarmupSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.campaignRef = campaignRef;
    this.discount = discount;
    this.summary = summary;
    this.channel = channel;
    this.cohort = cohort;
    this.graceDays = graceDays;
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

  canMoveTo(next: FallbackWarmupSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackWarmupSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback warmup summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"fallback warmup summary"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.graceDays + this.discount) * 100) / 100;
  }

  copy(): FallbackWarmupSummary {
    return new FallbackWarmupSummary(
      this.code,
      this.name,
      this.revision,
      this.campaignRef,
      this.discount,
      this.summary,
      this.channel,
      this.cohort,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback warmup summary in status planned. */
export function newFallbackWarmupSummary(code: string, name: string): FallbackWarmupSummary {
  return new FallbackWarmupSummary(code, name, 0, "", 0, "", "", "", 0, "planned");
}
