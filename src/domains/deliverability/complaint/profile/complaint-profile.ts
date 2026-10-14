/**
 * The complaint profile records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint profile is in its life cycle. */
export type ComplaintProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a complaint profile and its current status. */
export class ComplaintProfile {
  code: string;
  title: string;
  pinned: boolean;
  openRate: number;
  clicks: number;
  frequencyCap: number;
  journeyId: string;
  status: ComplaintProfileStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    openRate: number,
    clicks: number,
    frequencyCap: number,
    journeyId: string,
    status: ComplaintProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.openRate = openRate;
    this.clicks = clicks;
    this.frequencyCap = frequencyCap;
    this.journeyId = journeyId;
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

  canMoveTo(next: ComplaintProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ComplaintProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"complaint profile"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.clicks + this.frequencyCap) * 100) / 100;
  }

  copy(): ComplaintProfile {
    return new ComplaintProfile(
      this.code,
      this.title,
      this.pinned,
      this.openRate,
      this.clicks,
      this.frequencyCap,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a complaint profile in status proposed. */
export function newComplaintProfile(code: string, title: string): ComplaintProfile {
  return new ComplaintProfile(code, title, false, 0, 0, 0, "", "proposed");
}
