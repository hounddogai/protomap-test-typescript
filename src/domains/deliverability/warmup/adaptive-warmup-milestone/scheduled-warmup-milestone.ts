import * as text from "../../../../kit/text.js";

/** Where a scheduled warmup milestone is in its life cycle. */
export type ScheduledWarmupMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled warmup milestone. Its code is unique within a tenant. */
export class ScheduledWarmupMilestone {
  code: string;
  label: string;
  timezone: string;
  name: string;
  summary: string;
  quantity: number;
  durationMinutes: number;
  status: ScheduledWarmupMilestoneStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    name: string,
    summary: string,
    quantity: number,
    durationMinutes: number,
    status: ScheduledWarmupMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.name = name;
    this.summary = summary;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ScheduledWarmupMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
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

  moveTo(next: ScheduledWarmupMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled warmup milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round(this.quantity * this.durationMinutes * 100) / 100;
  }

  copy(): ScheduledWarmupMilestone {
    return new ScheduledWarmupMilestone(
      this.code,
      this.label,
      this.timezone,
      this.name,
      this.summary,
      this.quantity,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled warmup milestone in status proposed. */
export function newScheduledWarmupMilestone(code: string, label: string): ScheduledWarmupMilestone {
  return new ScheduledWarmupMilestone(code, label, "", "", "", 0, 0, "proposed");
}
