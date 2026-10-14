/**
 * The fallback retention record records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback retention record is in its life cycle. */
export type FallbackRetentionRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fallback retention record and its current status. */
export class FallbackRetentionRecord {
  code: string;
  name: string;
  bid: number;
  ratio: number;
  sendAt: number;
  amount: number;
  active: boolean;
  category: string;
  score: number;
  status: FallbackRetentionRecordStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    ratio: number,
    sendAt: number,
    amount: number,
    active: boolean,
    category: string,
    score: number,
    status: FallbackRetentionRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.ratio = ratio;
    this.sendAt = sendAt;
    this.amount = amount;
    this.active = active;
    this.category = category;
    this.score = score;
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

  canMoveTo(next: FallbackRetentionRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackRetentionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback retention record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.bid - this.score) * 100) / 100;
  }

  copy(): FallbackRetentionRecord {
    return new FallbackRetentionRecord(
      this.code,
      this.name,
      this.bid,
      this.ratio,
      this.sendAt,
      this.amount,
      this.active,
      this.category,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback retention record in status open. */
export function newFallbackRetentionRecord(code: string, name: string): FallbackRetentionRecord {
  return new FallbackRetentionRecord(code, name, 0, 0, 0, 0, false, "", 0, "open");
}
