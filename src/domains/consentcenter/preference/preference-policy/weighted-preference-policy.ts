/**
 * The weighted preference policy records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted preference policy is in its life cycle. */
export type WeightedPreferencePolicyStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a weighted preference policy and its current status. */
export class WeightedPreferencePolicy {
  code: string;
  name: string;
  windowDays: number;
  region: string;
  rate: number;
  locale: string;
  impressions: number;
  retries: number;
  minimum: number;
  status: WeightedPreferencePolicyStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    region: string,
    rate: number,
    locale: string,
    impressions: number,
    retries: number,
    minimum: number,
    status: WeightedPreferencePolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.region = region;
    this.rate = rate;
    this.locale = locale;
    this.impressions = impressions;
    this.retries = retries;
    this.minimum = minimum;
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

  canMoveTo(next: WeightedPreferencePolicyStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: WeightedPreferencePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted preference policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedLoad(): number {
    return Math.round((this.rate - this.windowDays) * 100) / 100;
  }

  copy(): WeightedPreferencePolicy {
    return new WeightedPreferencePolicy(
      this.code,
      this.name,
      this.windowDays,
      this.region,
      this.rate,
      this.locale,
      this.impressions,
      this.retries,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted preference policy in status new. */
export function newWeightedPreferencePolicy(code: string, name: string): WeightedPreferencePolicy {
  return new WeightedPreferencePolicy(code, name, 0, "", 0, "", 0, 0, 0, "new");
}
