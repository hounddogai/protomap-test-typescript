/**
 * The scheduled subscription plan records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled subscription plan is in its life cycle. */
export type ScheduledSubscriptionPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a scheduled subscription plan and its current status. */
export class ScheduledSubscriptionPlan {
  code: string;
  name: string;
  floorValue: number;
  attempts: number;
  title: string;
  reviewer: string;
  version: number;
  channel: string;
  summary: string;
  status: ScheduledSubscriptionPlanStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    attempts: number,
    title: string,
    reviewer: string,
    version: number,
    channel: string,
    summary: string,
    status: ScheduledSubscriptionPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.attempts = attempts;
    this.title = title;
    this.reviewer = reviewer;
    this.version = version;
    this.channel = channel;
    this.summary = summary;
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

  canMoveTo(next: ScheduledSubscriptionPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledSubscriptionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled subscription plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.attempts + this.floorValue) * 100) / 100;
  }

  copy(): ScheduledSubscriptionPlan {
    return new ScheduledSubscriptionPlan(
      this.code,
      this.name,
      this.floorValue,
      this.attempts,
      this.title,
      this.reviewer,
      this.version,
      this.channel,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled subscription plan in status planned. */
export function newScheduledSubscriptionPlan(code: string, name: string): ScheduledSubscriptionPlan {
  return new ScheduledSubscriptionPlan(code, name, 0, 0, "", "", 0, "", "", "planned");
}
