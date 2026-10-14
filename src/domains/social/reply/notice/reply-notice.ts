/**
 * The reply notice records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply notice is in its life cycle. */
export type ReplyNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a reply notice and its current status. */
export class ReplyNotice {
  code: string;
  label: string;
  contactEmail: string;
  weight: number;
  currency: string;
  status: ReplyNoticeStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    weight: number,
    currency: string,
    status: ReplyNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.currency = currency;
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

  canMoveTo(next: ReplyNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "active" || next === "closed";
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

  moveTo(next: ReplyNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reply notice"} ${this.code}`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): ReplyNotice {
    return new ReplyNotice(this.code, this.label, this.contactEmail, this.weight, this.currency, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reply notice in status draft. */
export function newReplyNotice(code: string, label: string): ReplyNotice {
  return new ReplyNotice(code, label, "", 0, "", "draft");
}
