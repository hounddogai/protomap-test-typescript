import * as text from "../../../../kit/text.js";

/** Where a manual ticket view schedule is in its life cycle. */
export type ManualTicketViewScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual ticket view schedule. Its code is unique within a tenant. */
export class ManualTicketViewSchedule {
  code: string;
  title: string;
  ratio: number;
  startsAt: number;
  archived: boolean;
  variant: string;
  updatedAt: number;
  contactEmail: string;
  conversionRate: number;
  version: number;
  reviewer: string;
  status: ManualTicketViewScheduleStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    startsAt: number,
    archived: boolean,
    variant: string,
    updatedAt: number,
    contactEmail: string,
    conversionRate: number,
    version: number,
    reviewer: string,
    status: ManualTicketViewScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.startsAt = startsAt;
    this.archived = archived;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
    this.version = version;
    this.reviewer = reviewer;
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

  canMoveTo(next: ManualTicketViewScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualTicketViewScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual ticket view schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"manual ticket view schedule"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.ratio * this.updatedAt * 100) / 100;
  }

  copy(): ManualTicketViewSchedule {
    return new ManualTicketViewSchedule(
      this.code,
      this.title,
      this.ratio,
      this.startsAt,
      this.archived,
      this.variant,
      this.updatedAt,
      this.contactEmail,
      this.conversionRate,
      this.version,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual ticket view schedule in status open. */
export function newManualTicketViewSchedule(code: string, title: string): ManualTicketViewSchedule {
  return new ManualTicketViewSchedule(code, title, 0, 0, false, "", 0, "", 0, 0, "", "open");
}
