import * as text from "../../../../kit/text.js";

/** Where a fallback credit notice is in its life cycle. */
export type FallbackCreditNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback credit notice and its current status. */
export class FallbackCreditNotice {
  code: string;
  name: string;
  bid: number;
  durationMinutes: number;
  channel: string;
  status: FallbackCreditNoticeStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    durationMinutes: number,
    channel: string,
    status: FallbackCreditNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackCreditNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCreditNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback credit notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback credit notice"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.bid * this.durationMinutes * 100) / 100;
  }

  copy(): FallbackCreditNotice {
    return new FallbackCreditNotice(this.code, this.name, this.bid, this.durationMinutes, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback credit notice in status idle. */
export function newFallbackCreditNotice(code: string, name: string): FallbackCreditNotice {
  return new FallbackCreditNotice(code, name, 0, 0, "", "idle");
}
