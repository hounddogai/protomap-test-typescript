import * as text from "../../../../kit/text.js";

/** Where a strict domain schedule is in its life cycle. */
export type StrictDomainScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One strict domain schedule, with what the planners need to act on it. */
export class StrictDomainSchedule {
  code: string;
  title: string;
  sendAt: number;
  source: string;
  approved: boolean;
  margin: number;
  journeyId: string;
  locale: string;
  externalRef: string;
  cost: number;
  active: boolean;
  status: StrictDomainScheduleStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    source: string,
    approved: boolean,
    margin: number,
    journeyId: string,
    locale: string,
    externalRef: string,
    cost: number,
    active: boolean,
    status: StrictDomainScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.source = source;
    this.approved = approved;
    this.margin = margin;
    this.journeyId = journeyId;
    this.locale = locale;
    this.externalRef = externalRef;
    this.cost = cost;
    this.active = active;
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

  canMoveTo(next: StrictDomainScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
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

  moveTo(next: StrictDomainScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict domain schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.margin + this.sendAt) * 100) / 100;
  }

  copy(): StrictDomainSchedule {
    return new StrictDomainSchedule(
      this.code,
      this.title,
      this.sendAt,
      this.source,
      this.approved,
      this.margin,
      this.journeyId,
      this.locale,
      this.externalRef,
      this.cost,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a strict domain schedule in status idle. */
export function newStrictDomainSchedule(code: string, title: string): StrictDomainSchedule {
  return new StrictDomainSchedule(code, title, 0, "", false, 0, "", "", "", 0, false, "idle");
}
