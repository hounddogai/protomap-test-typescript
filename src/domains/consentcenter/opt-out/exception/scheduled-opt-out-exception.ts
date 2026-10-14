/**
 * The scheduled opt out exception records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled opt out exception is in its life cycle. */
export type ScheduledOptOutExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One scheduled opt out exception, with what the planners need to act on it. */
export class ScheduledOptOutException {
  code: string;
  title: string;
  quantity: number;
  floorValue: number;
  clicks: number;
  ownerId: string;
  windowDays: number;
  channel: string;
  region: string;
  locale: string;
  status: ScheduledOptOutExceptionStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    floorValue: number,
    clicks: number,
    ownerId: string,
    windowDays: number,
    channel: string,
    region: string,
    locale: string,
    status: ScheduledOptOutExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.floorValue = floorValue;
    this.clicks = clicks;
    this.ownerId = ownerId;
    this.windowDays = windowDays;
    this.channel = channel;
    this.region = region;
    this.locale = locale;
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

  canMoveTo(next: ScheduledOptOutExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledOptOutExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled opt out exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round(this.quantity * this.clicks * 100) / 100;
  }

  copy(): ScheduledOptOutException {
    return new ScheduledOptOutException(
      this.code,
      this.title,
      this.quantity,
      this.floorValue,
      this.clicks,
      this.ownerId,
      this.windowDays,
      this.channel,
      this.region,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled opt out exception in status idle. */
export function newScheduledOptOutException(code: string, title: string): ScheduledOptOutException {
  return new ScheduledOptOutException(code, title, 0, 0, 0, "", 0, "", "", "", "idle");
}
