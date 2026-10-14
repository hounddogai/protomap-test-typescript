import * as text from "../../../../kit/text.js";

/** Where a scheduled domain tier is in its life cycle. */
export type ScheduledDomainTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled domain tier as the domain team keeps it. */
export class ScheduledDomainTier {
  code: string;
  label: string;
  timezone: string;
  title: string;
  graceDays: number;
  status: ScheduledDomainTierStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    title: string,
    graceDays: number,
    status: ScheduledDomainTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.title = title;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledDomainTierStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledDomainTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled domain tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled domain tier"} ${this.code}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): ScheduledDomainTier {
    return new ScheduledDomainTier(this.code, this.label, this.timezone, this.title, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled domain tier in status draft. */
export function newScheduledDomainTier(code: string, label: string): ScheduledDomainTier {
  return new ScheduledDomainTier(code, label, "", "", 0, "draft");
}
