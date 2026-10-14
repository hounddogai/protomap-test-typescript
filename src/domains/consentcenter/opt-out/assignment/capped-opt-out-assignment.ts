/**
 * The capped opt out assignment records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped opt out assignment is in its life cycle. */
export type CappedOptOutAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a capped opt out assignment and its current status. */
export class CappedOptOutAssignment {
  code: string;
  title: string;
  externalRef: string;
  ceiling: number;
  timezone: string;
  margin: number;
  journeyId: string;
  endsAt: number;
  campaignRef: string;
  status: CappedOptOutAssignmentStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    ceiling: number,
    timezone: string,
    margin: number,
    journeyId: string,
    endsAt: number,
    campaignRef: string,
    status: CappedOptOutAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.ceiling = ceiling;
    this.timezone = timezone;
    this.margin = margin;
    this.journeyId = journeyId;
    this.endsAt = endsAt;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: CappedOptOutAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedOptOutAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped opt out assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round((this.margin + this.ceiling) * 100) / 100;
  }

  copy(): CappedOptOutAssignment {
    return new CappedOptOutAssignment(
      this.code,
      this.title,
      this.externalRef,
      this.ceiling,
      this.timezone,
      this.margin,
      this.journeyId,
      this.endsAt,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped opt out assignment in status new. */
export function newCappedOptOutAssignment(code: string, title: string): CappedOptOutAssignment {
  return new CappedOptOutAssignment(code, title, "", 0, "", 0, "", 0, "", "new");
}
