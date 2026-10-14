/**
 * The credit notice records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit notice is in its life cycle. */
export type CreditNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A credit notice. Its code is unique within a tenant. */
export class CreditNotice {
  code: string;
  label: string;
  impressions: number;
  conversionRate: number;
  cost: number;
  pinned: boolean;
  ownerId: string;
  cohort: string;
  status: CreditNoticeStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    conversionRate: number,
    cost: number,
    pinned: boolean,
    ownerId: string,
    cohort: string,
    status: CreditNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.cohort = cohort;
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

  canMoveTo(next: CreditNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
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

  moveTo(next: CreditNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"credit notice"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.cost + this.impressions) * 100) / 100;
  }

  copy(): CreditNotice {
    return new CreditNotice(
      this.code,
      this.label,
      this.impressions,
      this.conversionRate,
      this.cost,
      this.pinned,
      this.ownerId,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a credit notice in status draft. */
export function newCreditNotice(code: string, label: string): CreditNotice {
  return new CreditNotice(code, label, 0, 0, 0, false, "", "", "draft");
}
