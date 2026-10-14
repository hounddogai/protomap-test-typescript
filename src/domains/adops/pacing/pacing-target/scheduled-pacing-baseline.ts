import * as text from "../../../../kit/text.js";

/** Where a scheduled pacing baseline is in its life cycle. */
export type ScheduledPacingBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a scheduled pacing baseline and its current status. */
export class ScheduledPacingBaseline {
  code: string;
  label: string;
  rate: number;
  createdAt: number;
  bid: number;
  durationMinutes: number;
  expiresAt: number;
  budget: number;
  priority: number;
  version: number;
  status: ScheduledPacingBaselineStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    createdAt: number,
    bid: number,
    durationMinutes: number,
    expiresAt: number,
    budget: number,
    priority: number,
    version: number,
    status: ScheduledPacingBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.createdAt = createdAt;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.priority = priority;
    this.version = version;
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

  canMoveTo(next: ScheduledPacingBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ScheduledPacingBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled pacing baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.expiresAt + this.budget) * 100) / 100;
  }

  copy(): ScheduledPacingBaseline {
    return new ScheduledPacingBaseline(
      this.code,
      this.label,
      this.rate,
      this.createdAt,
      this.bid,
      this.durationMinutes,
      this.expiresAt,
      this.budget,
      this.priority,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled pacing baseline in status proposed. */
export function newScheduledPacingBaseline(code: string, label: string): ScheduledPacingBaseline {
  return new ScheduledPacingBaseline(code, label, 0, 0, 0, 0, 0, 0, 0, 0, "proposed");
}
