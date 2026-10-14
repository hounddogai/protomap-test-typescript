/**
 * The legacy activation ledger records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy activation ledger is in its life cycle. */
export type LegacyActivationLedgerStatus = "created" | "validated" | "published" | "retired";

/** The record of a legacy activation ledger and its current status. */
export class LegacyActivationLedger {
  code: string;
  title: string;
  batchSize: number;
  tags: string[];
  audienceId: string;
  rate: number;
  windowDays: number;
  description: string;
  campaignRef: string;
  status: LegacyActivationLedgerStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    tags: string[],
    audienceId: string,
    rate: number,
    windowDays: number,
    description: string,
    campaignRef: string,
    status: LegacyActivationLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.tags = tags;
    this.audienceId = audienceId;
    this.rate = rate;
    this.windowDays = windowDays;
    this.description = description;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: LegacyActivationLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
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

  moveTo(next: LegacyActivationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy activation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round(this.rate * this.windowDays * 100) / 100;
  }

  copy(): LegacyActivationLedger {
    return new LegacyActivationLedger(
      this.code,
      this.title,
      this.batchSize,
      this.tags,
      this.audienceId,
      this.rate,
      this.windowDays,
      this.description,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy activation ledger in status created. */
export function newLegacyActivationLedger(code: string, title: string): LegacyActivationLedger {
  return new LegacyActivationLedger(code, title, 0, [], "", 0, 0, "", "", "created");
}
