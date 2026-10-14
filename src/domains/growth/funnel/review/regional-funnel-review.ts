/**
 * The regional funnel review records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional funnel review is in its life cycle. */
export type RegionalFunnelReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One regional funnel review, with what the planners need to act on it. */
export class RegionalFunnelReview {
  code: string;
  title: string;
  channel: string;
  contactEmail: string;
  bid: number;
  status: RegionalFunnelReviewStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    contactEmail: string,
    bid: number,
    status: RegionalFunnelReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.bid = bid;
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

  canMoveTo(next: RegionalFunnelReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
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

  moveTo(next: RegionalFunnelReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional funnel review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): RegionalFunnelReview {
    return new RegionalFunnelReview(this.code, this.title, this.channel, this.contactEmail, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional funnel review in status idle. */
export function newRegionalFunnelReview(code: string, title: string): RegionalFunnelReview {
  return new RegionalFunnelReview(code, title, "", "", 0, "idle");
}
