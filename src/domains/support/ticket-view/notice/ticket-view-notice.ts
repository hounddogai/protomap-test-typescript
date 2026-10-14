/**
 * The ticket view notice records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view notice is in its life cycle. */
export type TicketViewNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** A ticket view notice as the ticket view team keeps it. */
export class TicketViewNotice {
  code: string;
  title: string;
  campaignRef: string;
  audienceId: string;
  pinned: boolean;
  cost: number;
  expiresAt: number;
  status: TicketViewNoticeStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    audienceId: string,
    pinned: boolean,
    cost: number,
    expiresAt: number,
    status: TicketViewNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.audienceId = audienceId;
    this.pinned = pinned;
    this.cost = cost;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: TicketViewNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"ticket view notice"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.expiresAt + this.cost) * 100) / 100;
  }

  copy(): TicketViewNotice {
    return new TicketViewNotice(
      this.code,
      this.title,
      this.campaignRef,
      this.audienceId,
      this.pinned,
      this.cost,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a ticket view notice in status new. */
export function newTicketViewNotice(code: string, title: string): TicketViewNotice {
  return new TicketViewNotice(code, title, "", "", false, 0, 0, "new");
}
