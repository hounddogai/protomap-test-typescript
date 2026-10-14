import * as text from "../../../../kit/text.js";

/** Where a primary subscription window is in its life cycle. */
export type PrimarySubscriptionWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a primary subscription window and its current status. */
export class PrimarySubscriptionWindow {
  code: string;
  title: string;
  sequence: number;
  pinned: boolean;
  currency: string;
  phone: string;
  clicks: number;
  reviewer: string;
  discount: number;
  impressions: number;
  status: PrimarySubscriptionWindowStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    pinned: boolean,
    currency: string,
    phone: string,
    clicks: number,
    reviewer: string,
    discount: number,
    impressions: number,
    status: PrimarySubscriptionWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.pinned = pinned;
    this.currency = currency;
    this.phone = phone;
    this.clicks = clicks;
    this.reviewer = reviewer;
    this.discount = discount;
    this.impressions = impressions;
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

  canMoveTo(next: PrimarySubscriptionWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
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
          case "draining":
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

  moveTo(next: PrimarySubscriptionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary subscription window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary subscription window"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.discount * this.sequence * 100) / 100;
  }

  copy(): PrimarySubscriptionWindow {
    return new PrimarySubscriptionWindow(
      this.code,
      this.title,
      this.sequence,
      this.pinned,
      this.currency,
      this.phone,
      this.clicks,
      this.reviewer,
      this.discount,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary subscription window in status idle. */
export function newPrimarySubscriptionWindow(code: string, title: string): PrimarySubscriptionWindow {
  return new PrimarySubscriptionWindow(code, title, 0, false, "", "", 0, "", 0, 0, "idle");
}
