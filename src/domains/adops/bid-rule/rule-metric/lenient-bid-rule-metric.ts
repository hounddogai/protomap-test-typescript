/**
 * The lenient bid rule metric records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient bid rule metric is in its life cycle. */
export type LenientBidRuleMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient bid rule metric and its current status. */
export class LenientBidRuleMetric {
  code: string;
  name: string;
  bid: number;
  checksum: string;
  approved: boolean;
  sequence: number;
  durationMinutes: number;
  frequencyCap: number;
  channel: string;
  attributes: Map<string, string>;
  status: LenientBidRuleMetricStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    checksum: string,
    approved: boolean,
    sequence: number,
    durationMinutes: number,
    frequencyCap: number,
    channel: string,
    attributes: Map<string, string>,
    status: LenientBidRuleMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.checksum = checksum;
    this.approved = approved;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.attributes = attributes;
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

  canMoveTo(next: LenientBidRuleMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientBidRuleMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient bid rule metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round(this.sequence * this.durationMinutes * 100) / 100;
  }

  copy(): LenientBidRuleMetric {
    return new LenientBidRuleMetric(
      this.code,
      this.name,
      this.bid,
      this.checksum,
      this.approved,
      this.sequence,
      this.durationMinutes,
      this.frequencyCap,
      this.channel,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient bid rule metric in status proposed. */
export function newLenientBidRuleMetric(code: string, name: string): LenientBidRuleMetric {
  return new LenientBidRuleMetric(code, name, 0, "", false, 0, 0, 0, "", new Map<string, string>(), "proposed");
}
