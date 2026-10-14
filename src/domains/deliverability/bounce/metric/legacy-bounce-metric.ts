/**
 * The legacy bounce metric records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy bounce metric is in its life cycle. */
export type LegacyBounceMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy bounce metric as the bounce team keeps it. */
export class LegacyBounceMetric {
  code: string;
  title: string;
  graceDays: number;
  maximum: number;
  channel: string;
  discount: number;
  utmSource: string;
  description: string;
  attempts: number;
  status: LegacyBounceMetricStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    maximum: number,
    channel: string,
    discount: number,
    utmSource: string,
    description: string,
    attempts: number,
    status: LegacyBounceMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.maximum = maximum;
    this.channel = channel;
    this.discount = discount;
    this.utmSource = utmSource;
    this.description = description;
    this.attempts = attempts;
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

  canMoveTo(next: LegacyBounceMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacyBounceMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy bounce metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.graceDays - this.maximum) * 100) / 100;
  }

  copy(): LegacyBounceMetric {
    return new LegacyBounceMetric(
      this.code,
      this.title,
      this.graceDays,
      this.maximum,
      this.channel,
      this.discount,
      this.utmSource,
      this.description,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy bounce metric in status draft. */
export function newLegacyBounceMetric(code: string, title: string): LegacyBounceMetric {
  return new LegacyBounceMetric(code, title, 0, 0, "", 0, "", "", 0, "draft");
}
