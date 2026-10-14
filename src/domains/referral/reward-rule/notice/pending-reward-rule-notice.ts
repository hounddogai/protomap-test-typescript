/**
 * The pending reward rule notice records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending reward rule notice is in its life cycle. */
export type PendingRewardRuleNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a pending reward rule notice and its current status. */
export class PendingRewardRuleNotice {
  code: string;
  name: string;
  phone: string;
  sendAt: number;
  quantity: number;
  title: string;
  rate: number;
  discount: number;
  score: number;
  batchSize: number;
  status: PendingRewardRuleNoticeStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    sendAt: number,
    quantity: number,
    title: string,
    rate: number,
    discount: number,
    score: number,
    batchSize: number,
    status: PendingRewardRuleNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.sendAt = sendAt;
    this.quantity = quantity;
    this.title = title;
    this.rate = rate;
    this.discount = discount;
    this.score = score;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingRewardRuleNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingRewardRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending reward rule notice"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.sendAt * this.discount * 100) / 100;
  }

  copy(): PendingRewardRuleNotice {
    return new PendingRewardRuleNotice(
      this.code,
      this.name,
      this.phone,
      this.sendAt,
      this.quantity,
      this.title,
      this.rate,
      this.discount,
      this.score,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending reward rule notice in status requested. */
export function newPendingRewardRuleNotice(code: string, name: string): PendingRewardRuleNotice {
  return new PendingRewardRuleNotice(code, name, "", 0, 0, "", 0, 0, 0, 0, "requested");
}
