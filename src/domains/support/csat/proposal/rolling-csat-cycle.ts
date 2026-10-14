import * as text from "../../../../kit/text.js";

/** Where a rolling csat cycle is in its life cycle. */
export type RollingCsatCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a rolling csat cycle and its current status. */
export class RollingCsatCycle {
  code: string;
  title: string;
  startsAt: number;
  createdAt: number;
  capacity: number;
  reviewer: string;
  timezone: string;
  phone: string;
  source: string;
  journeyId: string;
  currency: string;
  status: RollingCsatCycleStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    createdAt: number,
    capacity: number,
    reviewer: string,
    timezone: string,
    phone: string,
    source: string,
    journeyId: string,
    currency: string,
    status: RollingCsatCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.createdAt = createdAt;
    this.capacity = capacity;
    this.reviewer = reviewer;
    this.timezone = timezone;
    this.phone = phone;
    this.source = source;
    this.journeyId = journeyId;
    this.currency = currency;
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

  canMoveTo(next: RollingCsatCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingCsatCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling csat cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.createdAt * this.capacity * 100) / 100;
  }

  copy(): RollingCsatCycle {
    return new RollingCsatCycle(
      this.code,
      this.title,
      this.startsAt,
      this.createdAt,
      this.capacity,
      this.reviewer,
      this.timezone,
      this.phone,
      this.source,
      this.journeyId,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling csat cycle in status idle. */
export function newRollingCsatCycle(code: string, title: string): RollingCsatCycle {
  return new RollingCsatCycle(code, title, 0, 0, 0, "", "", "", "", "", "", "idle");
}
