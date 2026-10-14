import * as text from "../../../../kit/text.js";

/** Where a redemption milestone is in its life cycle. */
export type RedemptionMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a redemption milestone and its current status. */
export class RedemptionMilestone {
  code: string;
  name: string;
  summary: string;
  ceiling: number;
  label: string;
  channel: string;
  audienceId: string;
  weight: number;
  category: string;
  variant: string;
  bid: number;
  status: RedemptionMilestoneStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    ceiling: number,
    label: string,
    channel: string,
    audienceId: string,
    weight: number,
    category: string,
    variant: string,
    bid: number,
    status: RedemptionMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.ceiling = ceiling;
    this.label = label;
    this.channel = channel;
    this.audienceId = audienceId;
    this.weight = weight;
    this.category = category;
    this.variant = variant;
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

  canMoveTo(next: RedemptionMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: RedemptionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round((this.ceiling - this.weight) * 100) / 100;
  }

  copy(): RedemptionMilestone {
    return new RedemptionMilestone(
      this.code,
      this.name,
      this.summary,
      this.ceiling,
      this.label,
      this.channel,
      this.audienceId,
      this.weight,
      this.category,
      this.variant,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a redemption milestone in status idle. */
export function newRedemptionMilestone(code: string, name: string): RedemptionMilestone {
  return new RedemptionMilestone(code, name, "", 0, "", "", "", 0, "", "", 0, "idle");
}
