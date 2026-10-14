/**
 * The capped subscription record records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped subscription record is in its life cycle. */
export type CappedSubscriptionRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a capped subscription record and its current status. */
export class CappedSubscriptionRecord {
  code: string;
  title: string;
  reviewer: string;
  approved: boolean;
  impressions: number;
  status: CappedSubscriptionRecordStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    approved: boolean,
    impressions: number,
    status: CappedSubscriptionRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.approved = approved;
    this.impressions = impressions;
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

  canMoveTo(next: CappedSubscriptionRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedSubscriptionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped subscription record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped subscription record"} ${this.code}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): CappedSubscriptionRecord {
    return new CappedSubscriptionRecord(
      this.code,
      this.title,
      this.reviewer,
      this.approved,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped subscription record in status open. */
export function newCappedSubscriptionRecord(code: string, title: string): CappedSubscriptionRecord {
  return new CappedSubscriptionRecord(code, title, "", false, 0, "open");
}
