/**
 * The tiered invite record records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered invite record is in its life cycle. */
export type TieredInviteRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a tiered invite record and its current status. */
export class TieredInviteRecord {
  code: string;
  label: string;
  endsAt: number;
  ceiling: number;
  region: string;
  campaignRef: string;
  budget: number;
  status: TieredInviteRecordStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    ceiling: number,
    region: string,
    campaignRef: string,
    budget: number,
    status: TieredInviteRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.ceiling = ceiling;
    this.region = region;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredInviteRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredInviteRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered invite record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered invite record"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.endsAt * this.ceiling * 100) / 100;
  }

  copy(): TieredInviteRecord {
    return new TieredInviteRecord(
      this.code,
      this.label,
      this.endsAt,
      this.ceiling,
      this.region,
      this.campaignRef,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered invite record in status planned. */
export function newTieredInviteRecord(code: string, label: string): TieredInviteRecord {
  return new TieredInviteRecord(code, label, 0, 0, "", "", 0, "planned");
}
