/**
 * The complaint proposal records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint proposal is in its life cycle. */
export type ComplaintProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a complaint proposal and its current status. */
export class ComplaintProposal {
  code: string;
  name: string;
  margin: number;
  locale: string;
  timezone: string;
  ownerId: string;
  maximum: number;
  windowDays: number;
  channel: string;
  graceDays: number;
  status: ComplaintProposalStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    locale: string,
    timezone: string,
    ownerId: string,
    maximum: number,
    windowDays: number,
    channel: string,
    graceDays: number,
    status: ComplaintProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.locale = locale;
    this.timezone = timezone;
    this.ownerId = ownerId;
    this.maximum = maximum;
    this.windowDays = windowDays;
    this.channel = channel;
    this.graceDays = graceDays;
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

  canMoveTo(next: ComplaintProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ComplaintProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"complaint proposal"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.margin * this.maximum * 100) / 100;
  }

  copy(): ComplaintProposal {
    return new ComplaintProposal(
      this.code,
      this.name,
      this.margin,
      this.locale,
      this.timezone,
      this.ownerId,
      this.maximum,
      this.windowDays,
      this.channel,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a complaint proposal in status draft. */
export function newComplaintProposal(code: string, name: string): ComplaintProposal {
  return new ComplaintProposal(code, name, 0, "", "", "", 0, 0, "", 0, "draft");
}
