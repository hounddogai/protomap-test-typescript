import * as text from "../../../../kit/text.js";

/** Where a scheduled challenge window is in its life cycle. */
export type ScheduledChallengeWindowStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled challenge window and its current status. */
export class ScheduledChallengeWindow {
  code: string;
  title: string;
  margin: number;
  floorValue: number;
  budget: number;
  channel: string;
  ceiling: number;
  graceDays: number;
  cost: number;
  status: ScheduledChallengeWindowStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    floorValue: number,
    budget: number,
    channel: string,
    ceiling: number,
    graceDays: number,
    cost: number,
    status: ScheduledChallengeWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.floorValue = floorValue;
    this.budget = budget;
    this.channel = channel;
    this.ceiling = ceiling;
    this.graceDays = graceDays;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledChallengeWindowStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledChallengeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled challenge window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled challenge window"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.graceDays - this.budget) * 100) / 100;
  }

  copy(): ScheduledChallengeWindow {
    return new ScheduledChallengeWindow(
      this.code,
      this.title,
      this.margin,
      this.floorValue,
      this.budget,
      this.channel,
      this.ceiling,
      this.graceDays,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled challenge window in status created. */
export function newScheduledChallengeWindow(code: string, title: string): ScheduledChallengeWindow {
  return new ScheduledChallengeWindow(code, title, 0, 0, 0, "", 0, 0, 0, "created");
}
