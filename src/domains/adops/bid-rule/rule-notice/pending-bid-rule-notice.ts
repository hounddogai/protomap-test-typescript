/**
 * The pending bid rule notice records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending bid rule notice is in its life cycle. */
export type PendingBidRuleNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending bid rule notice. Its code is unique within a tenant. */
export class PendingBidRuleNotice {
  code: string;
  title: string;
  limit: number;
  quantity: number;
  channel: string;
  name: string;
  sequence: number;
  category: string;
  ratio: number;
  journeyId: string;
  status: PendingBidRuleNoticeStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    quantity: number,
    channel: string,
    name: string,
    sequence: number,
    category: string,
    ratio: number,
    journeyId: string,
    status: PendingBidRuleNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.quantity = quantity;
    this.channel = channel;
    this.name = name;
    this.sequence = sequence;
    this.category = category;
    this.ratio = ratio;
    this.journeyId = journeyId;
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

  canMoveTo(next: PendingBidRuleNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingBidRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bid rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.limit - this.quantity) * 100) / 100;
  }

  copy(): PendingBidRuleNotice {
    return new PendingBidRuleNotice(
      this.code,
      this.title,
      this.limit,
      this.quantity,
      this.channel,
      this.name,
      this.sequence,
      this.category,
      this.ratio,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending bid rule notice in status new. */
export function newPendingBidRuleNotice(code: string, title: string): PendingBidRuleNotice {
  return new PendingBidRuleNotice(code, title, 0, 0, "", "", 0, "", 0, "", "new");
}
