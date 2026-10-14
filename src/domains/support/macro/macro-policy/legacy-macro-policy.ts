/**
 * The legacy macro policy records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy macro policy is in its life cycle. */
export type LegacyMacroPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One legacy macro policy, with what the planners need to act on it. */
export class LegacyMacroPolicy {
  code: string;
  title: string;
  campaignRef: string;
  channel: string;
  country: string;
  graceDays: number;
  audienceId: string;
  batchSize: number;
  category: string;
  floorValue: number;
  conversionRate: number;
  status: LegacyMacroPolicyStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    channel: string,
    country: string,
    graceDays: number,
    audienceId: string,
    batchSize: number,
    category: string,
    floorValue: number,
    conversionRate: number,
    status: LegacyMacroPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.country = country;
    this.graceDays = graceDays;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
    this.category = category;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyMacroPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyMacroPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy macro policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.floorValue - this.conversionRate) * 100) / 100;
  }

  copy(): LegacyMacroPolicy {
    return new LegacyMacroPolicy(
      this.code,
      this.title,
      this.campaignRef,
      this.channel,
      this.country,
      this.graceDays,
      this.audienceId,
      this.batchSize,
      this.category,
      this.floorValue,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy macro policy in status open. */
export function newLegacyMacroPolicy(code: string, title: string): LegacyMacroPolicy {
  return new LegacyMacroPolicy(code, title, "", "", "", 0, "", 0, "", 0, 0, "open");
}
