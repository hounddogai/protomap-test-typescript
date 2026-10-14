/**
 * The legacy branch target records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy branch target is in its life cycle. */
export type LegacyBranchTargetStatus = "created" | "validated" | "published" | "retired";

/** The record of a legacy branch target and its current status. */
export class LegacyBranchTarget {
  code: string;
  title: string;
  currency: string;
  country: string;
  budget: number;
  maximum: number;
  sendAt: number;
  channel: string;
  summary: string;
  status: LegacyBranchTargetStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    country: string,
    budget: number,
    maximum: number,
    sendAt: number,
    channel: string,
    summary: string,
    status: LegacyBranchTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.country = country;
    this.budget = budget;
    this.maximum = maximum;
    this.sendAt = sendAt;
    this.channel = channel;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyBranchTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyBranchTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy branch target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round((this.maximum - this.sendAt) * 100) / 100;
  }

  copy(): LegacyBranchTarget {
    return new LegacyBranchTarget(
      this.code,
      this.title,
      this.currency,
      this.country,
      this.budget,
      this.maximum,
      this.sendAt,
      this.channel,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy branch target in status created. */
export function newLegacyBranchTarget(code: string, title: string): LegacyBranchTarget {
  return new LegacyBranchTarget(code, title, "", "", 0, 0, 0, "", "", "created");
}
