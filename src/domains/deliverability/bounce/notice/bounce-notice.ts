/**
 * The bounce notice records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce notice is in its life cycle. */
export type BounceNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A bounce notice. Its code is unique within a tenant. */
export class BounceNotice {
  code: string;
  label: string;
  rate: number;
  channel: string;
  minimum: number;
  active: boolean;
  status: BounceNoticeStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    channel: string,
    minimum: number,
    active: boolean,
    status: BounceNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.channel = channel;
    this.minimum = minimum;
    this.active = active;
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

  canMoveTo(next: BounceNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"bounce notice"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.rate + this.minimum) * 100) / 100;
  }

  copy(): BounceNotice {
    return new BounceNotice(this.code, this.label, this.rate, this.channel, this.minimum, this.active, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a bounce notice in status planned. */
export function newBounceNotice(code: string, label: string): BounceNotice {
  return new BounceNotice(code, label, 0, "", 0, false, "planned");
}
