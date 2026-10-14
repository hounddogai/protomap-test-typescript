/**
 * The bid rule bundle records of adops's bid rule work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule bundle is in its life cycle. */
export type BidRuleBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** A bid rule bundle. Its code is unique within a tenant. */
export class BidRuleBundle {
  code: string;
  label: string;
  cohort: string;
  notes: string;
  score: number;
  attributes: Map<string, string>;
  checksum: string;
  status: BidRuleBundleStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    notes: string,
    score: number,
    attributes: Map<string, string>,
    checksum: string,
    status: BidRuleBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.notes = notes;
    this.score = score;
    this.attributes = attributes;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"bid rule bundle"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): BidRuleBundle {
    return new BidRuleBundle(
      this.code,
      this.label,
      this.cohort,
      this.notes,
      this.score,
      this.attributes,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule bundle in status requested. */
export function newBidRuleBundle(code: string, label: string): BidRuleBundle {
  return new BidRuleBundle(code, label, "", "", 0, new Map<string, string>(), "", "requested");
}
