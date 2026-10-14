/**
 * The global domain group records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global domain group is in its life cycle. */
export type GlobalDomainGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global domain group. Its code is unique within a tenant. */
export class GlobalDomainGroup {
  code: string;
  title: string;
  archived: boolean;
  segment: string;
  weight: number;
  locale: string;
  rate: number;
  amount: number;
  status: GlobalDomainGroupStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    segment: string,
    weight: number,
    locale: string,
    rate: number,
    amount: number,
    status: GlobalDomainGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.segment = segment;
    this.weight = weight;
    this.locale = locale;
    this.rate = rate;
    this.amount = amount;
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

  canMoveTo(next: GlobalDomainGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalDomainGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global domain group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.amount - this.rate) * 100) / 100;
  }

  copy(): GlobalDomainGroup {
    return new GlobalDomainGroup(
      this.code,
      this.title,
      this.archived,
      this.segment,
      this.weight,
      this.locale,
      this.rate,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global domain group in status proposed. */
export function newGlobalDomainGroup(code: string, title: string): GlobalDomainGroup {
  return new GlobalDomainGroup(code, title, false, "", 0, "", 0, 0, "proposed");
}
