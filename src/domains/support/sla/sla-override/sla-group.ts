import * as text from "../../../../kit/text.js";

/** Where a sla group is in its life cycle. */
export type SlaGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One sla group, with what the planners need to act on it. */
export class SlaGroup {
  code: string;
  title: string;
  endsAt: number;
  archived: boolean;
  priority: number;
  timezone: string;
  region: string;
  sequence: number;
  status: SlaGroupStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    archived: boolean,
    priority: number,
    timezone: string,
    region: string,
    sequence: number,
    status: SlaGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.archived = archived;
    this.priority = priority;
    this.timezone = timezone;
    this.region = region;
    this.sequence = sequence;
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

  canMoveTo(next: SlaGroupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SlaGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round(this.endsAt * this.priority * 100) / 100;
  }

  copy(): SlaGroup {
    return new SlaGroup(
      this.code,
      this.title,
      this.endsAt,
      this.archived,
      this.priority,
      this.timezone,
      this.region,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a sla group in status open. */
export function newSlaGroup(code: string, title: string): SlaGroup {
  return new SlaGroup(code, title, 0, false, 0, "", "", 0, "open");
}
