/**
 * The pending exit rule digest records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending exit rule digest is in its life cycle. */
export type PendingExitRuleDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One pending exit rule digest, with what the planners need to act on it. */
export class PendingExitRuleDigest {
  code: string;
  title: string;
  sendAt: number;
  active: boolean;
  utmSource: string;
  visible: boolean;
  rate: number;
  pinned: boolean;
  locale: string;
  ownerId: string;
  amount: number;
  status: PendingExitRuleDigestStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    active: boolean,
    utmSource: string,
    visible: boolean,
    rate: number,
    pinned: boolean,
    locale: string,
    ownerId: string,
    amount: number,
    status: PendingExitRuleDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.active = active;
    this.utmSource = utmSource;
    this.visible = visible;
    this.rate = rate;
    this.pinned = pinned;
    this.locale = locale;
    this.ownerId = ownerId;
    this.amount = amount;
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

  canMoveTo(next: PendingExitRuleDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
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

  moveTo(next: PendingExitRuleDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending exit rule digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending exit rule digest"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.sendAt - this.amount) * 100) / 100;
  }

  copy(): PendingExitRuleDigest {
    return new PendingExitRuleDigest(
      this.code,
      this.title,
      this.sendAt,
      this.active,
      this.utmSource,
      this.visible,
      this.rate,
      this.pinned,
      this.locale,
      this.ownerId,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending exit rule digest in status planned. */
export function newPendingExitRuleDigest(code: string, title: string): PendingExitRuleDigest {
  return new PendingExitRuleDigest(code, title, 0, false, "", false, 0, false, "", "", 0, "planned");
}
