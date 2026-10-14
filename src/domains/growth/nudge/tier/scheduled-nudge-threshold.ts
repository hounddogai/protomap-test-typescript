import * as text from "../../../../kit/text.js";

/** Where a scheduled nudge threshold is in its life cycle. */
export type ScheduledNudgeThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled nudge threshold. Its code is unique within a tenant. */
export class ScheduledNudgeThreshold {
  code: string;
  title: string;
  cost: number;
  floorValue: number;
  bid: number;
  openRate: number;
  graceDays: number;
  status: ScheduledNudgeThresholdStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    floorValue: number,
    bid: number,
    openRate: number,
    graceDays: number,
    status: ScheduledNudgeThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.floorValue = floorValue;
    this.bid = bid;
    this.openRate = openRate;
    this.graceDays = graceDays;
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

  canMoveTo(next: ScheduledNudgeThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
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

  moveTo(next: ScheduledNudgeThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled nudge threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled nudge threshold"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.graceDays * this.bid * 100) / 100;
  }

  copy(): ScheduledNudgeThreshold {
    return new ScheduledNudgeThreshold(
      this.code,
      this.title,
      this.cost,
      this.floorValue,
      this.bid,
      this.openRate,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled nudge threshold in status planned. */
export function newScheduledNudgeThreshold(code: string, title: string): ScheduledNudgeThreshold {
  return new ScheduledNudgeThreshold(code, title, 0, 0, 0, 0, 0, "planned");
}
