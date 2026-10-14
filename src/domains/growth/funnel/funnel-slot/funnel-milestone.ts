import * as text from "../../../../kit/text.js";

/** Where a funnel milestone is in its life cycle. */
export type FunnelMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One funnel milestone, with what the planners need to act on it. */
export class FunnelMilestone {
  code: string;
  title: string;
  sendAt: number;
  externalRef: string;
  audienceId: string;
  phone: string;
  variant: string;
  startsAt: number;
  graceDays: number;
  bid: number;
  status: FunnelMilestoneStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    externalRef: string,
    audienceId: string,
    phone: string,
    variant: string,
    startsAt: number,
    graceDays: number,
    bid: number,
    status: FunnelMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.externalRef = externalRef;
    this.audienceId = audienceId;
    this.phone = phone;
    this.variant = variant;
    this.startsAt = startsAt;
    this.graceDays = graceDays;
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

  canMoveTo(next: FunnelMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FunnelMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.bid + this.sendAt) * 100) / 100;
  }

  copy(): FunnelMilestone {
    return new FunnelMilestone(
      this.code,
      this.title,
      this.sendAt,
      this.externalRef,
      this.audienceId,
      this.phone,
      this.variant,
      this.startsAt,
      this.graceDays,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a funnel milestone in status idle. */
export function newFunnelMilestone(code: string, title: string): FunnelMilestone {
  return new FunnelMilestone(code, title, 0, "", "", "", "", 0, 0, 0, "idle");
}
