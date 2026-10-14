/**
 * The ticket view review records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view review is in its life cycle. */
export type TicketViewReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One ticket view review, with what the planners need to act on it. */
export class TicketViewReview {
  code: string;
  title: string;
  revision: number;
  graceDays: number;
  version: number;
  margin: number;
  floorValue: number;
  retries: number;
  phone: string;
  pinned: boolean;
  status: TicketViewReviewStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    graceDays: number,
    version: number,
    margin: number,
    floorValue: number,
    retries: number,
    phone: string,
    pinned: boolean,
    status: TicketViewReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.graceDays = graceDays;
    this.version = version;
    this.margin = margin;
    this.floorValue = floorValue;
    this.retries = retries;
    this.phone = phone;
    this.pinned = pinned;
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

  canMoveTo(next: TicketViewReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
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

  moveTo(next: TicketViewReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.margin - this.retries) * 100) / 100;
  }

  copy(): TicketViewReview {
    return new TicketViewReview(
      this.code,
      this.title,
      this.revision,
      this.graceDays,
      this.version,
      this.margin,
      this.floorValue,
      this.retries,
      this.phone,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a ticket view review in status proposed. */
export function newTicketViewReview(code: string, title: string): TicketViewReview {
  return new TicketViewReview(code, title, 0, 0, 0, 0, 0, 0, "", false, "proposed");
}
