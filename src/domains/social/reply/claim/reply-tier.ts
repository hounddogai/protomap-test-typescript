import * as text from "../../../../kit/text.js";

/** Where a reply tier is in its life cycle. */
export type ReplyTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A reply tier. Its code is unique within a tenant. */
export class ReplyTier {
  code: string;
  title: string;
  country: string;
  graceDays: number;
  version: number;
  windowDays: number;
  active: boolean;
  createdAt: number;
  externalRef: string;
  amount: number;
  status: ReplyTierStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    graceDays: number,
    version: number,
    windowDays: number,
    active: boolean,
    createdAt: number,
    externalRef: string,
    amount: number,
    status: ReplyTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.graceDays = graceDays;
    this.version = version;
    this.windowDays = windowDays;
    this.active = active;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.amount = amount;
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

  canMoveTo(next: ReplyTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ReplyTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.amount - this.windowDays) * 100) / 100;
  }

  copy(): ReplyTier {
    return new ReplyTier(
      this.code,
      this.title,
      this.country,
      this.graceDays,
      this.version,
      this.windowDays,
      this.active,
      this.createdAt,
      this.externalRef,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reply tier in status idle. */
export function newReplyTier(code: string, title: string): ReplyTier {
  return new ReplyTier(code, title, "", 0, 0, 0, false, 0, "", 0, "idle");
}
