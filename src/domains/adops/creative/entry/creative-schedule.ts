import * as text from "../../../../kit/text.js";

/** Where a creative schedule is in its life cycle. */
export type CreativeScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A creative schedule. Its code is unique within a tenant. */
export class CreativeSchedule {
  code: string;
  title: string;
  clicks: number;
  timezone: string;
  revision: number;
  description: string;
  contactEmail: string;
  status: CreativeScheduleStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    timezone: string,
    revision: number,
    description: string,
    contactEmail: string,
    status: CreativeScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.timezone = timezone;
    this.revision = revision;
    this.description = description;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CreativeScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"creative schedule"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.clicks - this.revision) * 100) / 100;
  }

  copy(): CreativeSchedule {
    return new CreativeSchedule(
      this.code,
      this.title,
      this.clicks,
      this.timezone,
      this.revision,
      this.description,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a creative schedule in status proposed. */
export function newCreativeSchedule(code: string, title: string): CreativeSchedule {
  return new CreativeSchedule(code, title, 0, "", 0, "", "", "proposed");
}
