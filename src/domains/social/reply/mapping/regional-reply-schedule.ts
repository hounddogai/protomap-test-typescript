import * as text from "../../../../kit/text.js";

/** Where a regional reply schedule is in its life cycle. */
export type RegionalReplyScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional reply schedule. Its code is unique within a tenant. */
export class RegionalReplySchedule {
  code: string;
  title: string;
  locale: string;
  startsAt: number;
  contactEmail: string;
  quantity: number;
  segment: string;
  approved: boolean;
  createdAt: number;
  ceiling: number;
  windowDays: number;
  status: RegionalReplyScheduleStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    startsAt: number,
    contactEmail: string,
    quantity: number,
    segment: string,
    approved: boolean,
    createdAt: number,
    ceiling: number,
    windowDays: number,
    status: RegionalReplyScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.startsAt = startsAt;
    this.contactEmail = contactEmail;
    this.quantity = quantity;
    this.segment = segment;
    this.approved = approved;
    this.createdAt = createdAt;
    this.ceiling = ceiling;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalReplyScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalReplyScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reply schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional reply schedule"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.ceiling - this.windowDays) * 100) / 100;
  }

  copy(): RegionalReplySchedule {
    return new RegionalReplySchedule(
      this.code,
      this.title,
      this.locale,
      this.startsAt,
      this.contactEmail,
      this.quantity,
      this.segment,
      this.approved,
      this.createdAt,
      this.ceiling,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional reply schedule in status open. */
export function newRegionalReplySchedule(code: string, title: string): RegionalReplySchedule {
  return new RegionalReplySchedule(code, title, "", 0, "", 0, "", false, 0, 0, 0, "open");
}
