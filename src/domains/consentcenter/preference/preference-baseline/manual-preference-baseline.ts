/**
 * The manual preference baseline records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual preference baseline is in its life cycle. */
export type ManualPreferenceBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual preference baseline. Its code is unique within a tenant. */
export class ManualPreferenceBaseline {
  code: string;
  title: string;
  sequence: number;
  ratio: number;
  description: string;
  discount: number;
  active: boolean;
  bid: number;
  checksum: string;
  status: ManualPreferenceBaselineStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    ratio: number,
    description: string,
    discount: number,
    active: boolean,
    bid: number,
    checksum: string,
    status: ManualPreferenceBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.ratio = ratio;
    this.description = description;
    this.discount = discount;
    this.active = active;
    this.bid = bid;
    this.checksum = checksum;
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

  canMoveTo(next: ManualPreferenceBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualPreferenceBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual preference baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round((this.bid - this.discount) * 100) / 100;
  }

  copy(): ManualPreferenceBaseline {
    return new ManualPreferenceBaseline(
      this.code,
      this.title,
      this.sequence,
      this.ratio,
      this.description,
      this.discount,
      this.active,
      this.bid,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual preference baseline in status new. */
export function newManualPreferenceBaseline(code: string, title: string): ManualPreferenceBaseline {
  return new ManualPreferenceBaseline(code, title, 0, 0, "", 0, false, 0, "", "new");
}
