import * as text from "../../../../kit/text.js";

/** Where a capped nudge schedule is in its life cycle. */
export type CappedNudgeScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One capped nudge schedule, with what the planners need to act on it. */
export class CappedNudgeSchedule {
  code: string;
  title: string;
  version: number;
  attributes: Map<string, string>;
  weight: number;
  quantity: number;
  rate: number;
  startsAt: number;
  ownerId: string;
  margin: number;
  timezone: string;
  status: CappedNudgeScheduleStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    attributes: Map<string, string>,
    weight: number,
    quantity: number,
    rate: number,
    startsAt: number,
    ownerId: string,
    margin: number,
    timezone: string,
    status: CappedNudgeScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.attributes = attributes;
    this.weight = weight;
    this.quantity = quantity;
    this.rate = rate;
    this.startsAt = startsAt;
    this.ownerId = ownerId;
    this.margin = margin;
    this.timezone = timezone;
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

  canMoveTo(next: CappedNudgeScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedNudgeScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped nudge schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round((this.startsAt + this.margin) * 100) / 100;
  }

  copy(): CappedNudgeSchedule {
    return new CappedNudgeSchedule(
      this.code,
      this.title,
      this.version,
      this.attributes,
      this.weight,
      this.quantity,
      this.rate,
      this.startsAt,
      this.ownerId,
      this.margin,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped nudge schedule in status idle. */
export function newCappedNudgeSchedule(code: string, title: string): CappedNudgeSchedule {
  return new CappedNudgeSchedule(code, title, 0, new Map<string, string>(), 0, 0, 0, 0, "", 0, "", "idle");
}
