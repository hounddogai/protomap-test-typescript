/**
 * The lenient sla schedule records of support's sla work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient sla schedule is in its life cycle. */
export type LenientSlaScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient sla schedule as the sla team keeps it. */
export class LenientSlaSchedule {
  code: string;
  title: string;
  bid: number;
  campaignRef: string;
  channel: string;
  reviewer: string;
  createdAt: number;
  conversionRate: number;
  status: LenientSlaScheduleStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    campaignRef: string,
    channel: string,
    reviewer: string,
    createdAt: number,
    conversionRate: number,
    status: LenientSlaScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: LenientSlaScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientSlaScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient sla schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.bid - this.conversionRate) * 100) / 100;
  }

  copy(): LenientSlaSchedule {
    return new LenientSlaSchedule(
      this.code,
      this.title,
      this.bid,
      this.campaignRef,
      this.channel,
      this.reviewer,
      this.createdAt,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient sla schedule in status planned. */
export function newLenientSlaSchedule(code: string, title: string): LenientSlaSchedule {
  return new LenientSlaSchedule(code, title, 0, "", "", "", 0, 0, "planned");
}
