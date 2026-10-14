/**
 * The seasonal mention ledger records of social's mention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal mention ledger is in its life cycle. */
export type SeasonalMentionLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal mention ledger as the mention team keeps it. */
export class SeasonalMentionLedger {
  code: string;
  label: string;
  floorValue: number;
  quantity: number;
  ratio: number;
  impressions: number;
  segment: string;
  status: SeasonalMentionLedgerStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    quantity: number,
    ratio: number,
    impressions: number,
    segment: string,
    status: SeasonalMentionLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.quantity = quantity;
    this.ratio = ratio;
    this.impressions = impressions;
    this.segment = segment;
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

  canMoveTo(next: SeasonalMentionLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalMentionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal mention ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal mention ledger"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.floorValue * this.quantity * 100) / 100;
  }

  copy(): SeasonalMentionLedger {
    return new SeasonalMentionLedger(
      this.code,
      this.label,
      this.floorValue,
      this.quantity,
      this.ratio,
      this.impressions,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal mention ledger in status draft. */
export function newSeasonalMentionLedger(code: string, label: string): SeasonalMentionLedger {
  return new SeasonalMentionLedger(code, label, 0, 0, 0, 0, "", "draft");
}
