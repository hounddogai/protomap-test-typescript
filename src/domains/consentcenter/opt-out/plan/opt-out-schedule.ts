import * as text from "../../../../kit/text.js";

/** Where a opt out schedule is in its life cycle. */
export type OptOutScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One opt out schedule, with what the planners need to act on it. */
export class OptOutSchedule {
  code: string;
  title: string;
  reviewer: string;
  variant: string;
  attributes: Map<string, string>;
  approved: boolean;
  graceDays: number;
  frequencyCap: number;
  openRate: number;
  pinned: boolean;
  source: string;
  status: OptOutScheduleStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    variant: string,
    attributes: Map<string, string>,
    approved: boolean,
    graceDays: number,
    frequencyCap: number,
    openRate: number,
    pinned: boolean,
    source: string,
    status: OptOutScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.variant = variant;
    this.attributes = attributes;
    this.approved = approved;
    this.graceDays = graceDays;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.pinned = pinned;
    this.source = source;
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

  canMoveTo(next: OptOutScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"opt out schedule"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.frequencyCap + this.graceDays) * 100) / 100;
  }

  copy(): OptOutSchedule {
    return new OptOutSchedule(
      this.code,
      this.title,
      this.reviewer,
      this.variant,
      this.attributes,
      this.approved,
      this.graceDays,
      this.frequencyCap,
      this.openRate,
      this.pinned,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a opt out schedule in status proposed. */
export function newOptOutSchedule(code: string, title: string): OptOutSchedule {
  return new OptOutSchedule(code, title, "", "", new Map<string, string>(), false, 0, 0, 0, false, "", "proposed");
}
