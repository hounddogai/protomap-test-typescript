/**
 * The bid rule manifest records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule manifest is in its life cycle. */
export type BidRuleManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A bid rule manifest as the bid rule team keeps it. */
export class BidRuleManifest {
  code: string;
  label: string;
  ratio: number;
  bid: number;
  frequencyCap: number;
  updatedAt: number;
  rate: number;
  status: BidRuleManifestStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    bid: number,
    frequencyCap: number,
    updatedAt: number,
    rate: number,
    status: BidRuleManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.bid = bid;
    this.frequencyCap = frequencyCap;
    this.updatedAt = updatedAt;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"bid rule manifest"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.ratio + this.rate) * 100) / 100;
  }

  copy(): BidRuleManifest {
    return new BidRuleManifest(
      this.code,
      this.label,
      this.ratio,
      this.bid,
      this.frequencyCap,
      this.updatedAt,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule manifest in status idle. */
export function newBidRuleManifest(code: string, label: string): BidRuleManifest {
  return new BidRuleManifest(code, label, 0, 0, 0, 0, 0, "idle");
}
