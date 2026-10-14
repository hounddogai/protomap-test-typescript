/**
 * The subscription baseline records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription baseline is in its life cycle. */
export type SubscriptionBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** A subscription baseline as the subscription team keeps it. */
export class SubscriptionBaseline {
  code: string;
  label: string;
  campaignRef: string;
  segment: string;
  name: string;
  graceDays: number;
  region: string;
  utmSource: string;
  ratio: number;
  status: SubscriptionBaselineStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    segment: string,
    name: string,
    graceDays: number,
    region: string,
    utmSource: string,
    ratio: number,
    status: SubscriptionBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.name = name;
    this.graceDays = graceDays;
    this.region = region;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedValue(): number {
    return Math.round((this.ratio + this.graceDays) * 100) / 100;
  }

  copy(): SubscriptionBaseline {
    return new SubscriptionBaseline(
      this.code,
      this.label,
      this.campaignRef,
      this.segment,
      this.name,
      this.graceDays,
      this.region,
      this.utmSource,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a subscription baseline in status new. */
export function newSubscriptionBaseline(code: string, label: string): SubscriptionBaseline {
  return new SubscriptionBaseline(code, label, "", "", "", 0, "", "", 0, "new");
}
