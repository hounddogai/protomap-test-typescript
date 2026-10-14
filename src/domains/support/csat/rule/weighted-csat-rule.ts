/**
 * The weighted csat rule records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted csat rule is in its life cycle. */
export type WeightedCsatRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted csat rule as the csat team keeps it. */
export class WeightedCsatRule {
  code: string;
  name: string;
  notes: string;
  country: string;
  impressions: number;
  channel: string;
  retries: number;
  expiresAt: number;
  status: WeightedCsatRuleStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    country: string,
    impressions: number,
    channel: string,
    retries: number,
    expiresAt: number,
    status: WeightedCsatRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.country = country;
    this.impressions = impressions;
    this.channel = channel;
    this.retries = retries;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: WeightedCsatRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedCsatRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted csat rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round((this.expiresAt - this.retries) * 100) / 100;
  }

  copy(): WeightedCsatRule {
    return new WeightedCsatRule(
      this.code,
      this.name,
      this.notes,
      this.country,
      this.impressions,
      this.channel,
      this.retries,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted csat rule in status planned. */
export function newWeightedCsatRule(code: string, name: string): WeightedCsatRule {
  return new WeightedCsatRule(code, name, "", "", 0, "", 0, 0, "planned");
}
