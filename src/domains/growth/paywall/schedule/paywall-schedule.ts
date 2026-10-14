/**
 * The paywall schedule records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall schedule is in its life cycle. */
export type PaywallScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a paywall schedule and its current status. */
export class PaywallSchedule {
  code: string;
  label: string;
  channel: string;
  description: string;
  priority: number;
  ceiling: number;
  weight: number;
  status: PaywallScheduleStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    description: string,
    priority: number,
    ceiling: number,
    weight: number,
    status: PaywallScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.description = description;
    this.priority = priority;
    this.ceiling = ceiling;
    this.weight = weight;
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

  canMoveTo(next: PaywallScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PaywallScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.weight * this.ceiling * 100) / 100;
  }

  copy(): PaywallSchedule {
    return new PaywallSchedule(
      this.code,
      this.label,
      this.channel,
      this.description,
      this.priority,
      this.ceiling,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a paywall schedule in status idle. */
export function newPaywallSchedule(code: string, label: string): PaywallSchedule {
  return new PaywallSchedule(code, label, "", "", 0, 0, 0, "idle");
}
