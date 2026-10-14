/**
 * The global macro threshold records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global macro threshold is in its life cycle. */
export type GlobalMacroThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global macro threshold as the macro team keeps it. */
export class GlobalMacroThreshold {
  code: string;
  title: string;
  ratio: number;
  channel: string;
  startsAt: number;
  archived: boolean;
  limit: number;
  bid: number;
  sequence: number;
  status: GlobalMacroThresholdStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    channel: string,
    startsAt: number,
    archived: boolean,
    limit: number,
    bid: number,
    sequence: number,
    status: GlobalMacroThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.channel = channel;
    this.startsAt = startsAt;
    this.archived = archived;
    this.limit = limit;
    this.bid = bid;
    this.sequence = sequence;
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

  canMoveTo(next: GlobalMacroThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalMacroThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global macro threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global macro threshold"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.sequence + this.ratio) * 100) / 100;
  }

  copy(): GlobalMacroThreshold {
    return new GlobalMacroThreshold(
      this.code,
      this.title,
      this.ratio,
      this.channel,
      this.startsAt,
      this.archived,
      this.limit,
      this.bid,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global macro threshold in status draft. */
export function newGlobalMacroThreshold(code: string, title: string): GlobalMacroThreshold {
  return new GlobalMacroThreshold(code, title, 0, "", 0, false, 0, 0, 0, "draft");
}
