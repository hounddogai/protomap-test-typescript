/**
 * The reply schedule records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply schedule is in its life cycle. */
export type ReplyScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a reply schedule and its current status. */
export class ReplySchedule {
  code: string;
  name: string;
  visible: boolean;
  impressions: number;
  limit: number;
  priority: number;
  status: ReplyScheduleStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    impressions: number,
    limit: number,
    priority: number,
    status: ReplyScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.impressions = impressions;
    this.limit = limit;
    this.priority = priority;
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

  canMoveTo(next: ReplyScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ReplyScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.limit + this.impressions) * 100) / 100;
  }

  copy(): ReplySchedule {
    return new ReplySchedule(
      this.code,
      this.name,
      this.visible,
      this.impressions,
      this.limit,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reply schedule in status planned. */
export function newReplySchedule(code: string, name: string): ReplySchedule {
  return new ReplySchedule(code, name, false, 0, 0, 0, "planned");
}
