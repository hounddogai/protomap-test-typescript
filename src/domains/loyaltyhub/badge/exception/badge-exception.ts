/**
 * The badge exception records of loyaltyhub's badge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge exception is in its life cycle. */
export type BadgeExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One badge exception, with what the planners need to act on it. */
export class BadgeException {
  code: string;
  title: string;
  windowDays: number;
  priority: number;
  summary: string;
  sequence: number;
  frequencyCap: number;
  reviewer: string;
  phone: string;
  discount: number;
  quantity: number;
  status: BadgeExceptionStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    priority: number,
    summary: string,
    sequence: number,
    frequencyCap: number,
    reviewer: string,
    phone: string,
    discount: number,
    quantity: number,
    status: BadgeExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.priority = priority;
    this.summary = summary;
    this.sequence = sequence;
    this.frequencyCap = frequencyCap;
    this.reviewer = reviewer;
    this.phone = phone;
    this.discount = discount;
    this.quantity = quantity;
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

  canMoveTo(next: BadgeExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"badge exception"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.quantity - this.frequencyCap) * 100) / 100;
  }

  copy(): BadgeException {
    return new BadgeException(
      this.code,
      this.title,
      this.windowDays,
      this.priority,
      this.summary,
      this.sequence,
      this.frequencyCap,
      this.reviewer,
      this.phone,
      this.discount,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a badge exception in status proposed. */
export function newBadgeException(code: string, title: string): BadgeException {
  return new BadgeException(code, title, 0, 0, "", 0, 0, "", "", 0, 0, "proposed");
}
