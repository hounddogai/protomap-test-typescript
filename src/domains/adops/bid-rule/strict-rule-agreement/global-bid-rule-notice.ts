import * as text from "../../../../kit/text.js";

/** Where a global bid rule notice is in its life cycle. */
export type GlobalBidRuleNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global bid rule notice. Its code is unique within a tenant. */
export class GlobalBidRuleNotice {
  code: string;
  name: string;
  audienceId: string;
  rate: number;
  priority: number;
  bid: number;
  maximum: number;
  status: GlobalBidRuleNoticeStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    rate: number,
    priority: number,
    bid: number,
    maximum: number,
    status: GlobalBidRuleNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.rate = rate;
    this.priority = priority;
    this.bid = bid;
    this.maximum = maximum;
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

  canMoveTo(next: GlobalBidRuleNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalBidRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global bid rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round(this.maximum * this.priority * 100) / 100;
  }

  copy(): GlobalBidRuleNotice {
    return new GlobalBidRuleNotice(
      this.code,
      this.name,
      this.audienceId,
      this.rate,
      this.priority,
      this.bid,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global bid rule notice in status idle. */
export function newGlobalBidRuleNotice(code: string, name: string): GlobalBidRuleNotice {
  return new GlobalBidRuleNotice(code, name, "", 0, 0, 0, 0, "idle");
}
