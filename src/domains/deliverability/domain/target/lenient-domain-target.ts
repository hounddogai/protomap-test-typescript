/**
 * The lenient domain target records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient domain target is in its life cycle. */
export type LenientDomainTargetStatus = "created" | "validated" | "published" | "retired";

/** One lenient domain target, with what the planners need to act on it. */
export class LenientDomainTarget {
  code: string;
  label: string;
  discount: number;
  limit: number;
  currency: string;
  amount: number;
  pinned: boolean;
  name: string;
  source: string;
  status: LenientDomainTargetStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    limit: number,
    currency: string,
    amount: number,
    pinned: boolean,
    name: string,
    source: string,
    status: LenientDomainTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.limit = limit;
    this.currency = currency;
    this.amount = amount;
    this.pinned = pinned;
    this.name = name;
    this.source = source;
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

  canMoveTo(next: LenientDomainTargetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientDomainTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient domain target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.amount * this.discount * 100) / 100;
  }

  copy(): LenientDomainTarget {
    return new LenientDomainTarget(
      this.code,
      this.label,
      this.discount,
      this.limit,
      this.currency,
      this.amount,
      this.pinned,
      this.name,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient domain target in status created. */
export function newLenientDomainTarget(code: string, label: string): LenientDomainTarget {
  return new LenientDomainTarget(code, label, 0, 0, "", 0, false, "", "", "created");
}
