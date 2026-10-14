import * as text from "../../../../kit/text.js";

/** Where a tiered enrollment profile is in its life cycle. */
export type TieredEnrollmentProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered enrollment profile, with what the planners need to act on it. */
export class TieredEnrollmentProfile {
  code: string;
  label: string;
  windowDays: number;
  openRate: number;
  notes: string;
  limit: number;
  status: TieredEnrollmentProfileStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    openRate: number,
    notes: string,
    limit: number,
    status: TieredEnrollmentProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.openRate = openRate;
    this.notes = notes;
    this.limit = limit;
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

  canMoveTo(next: TieredEnrollmentProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredEnrollmentProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered enrollment profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.windowDays + this.limit) * 100) / 100;
  }

  copy(): TieredEnrollmentProfile {
    return new TieredEnrollmentProfile(
      this.code,
      this.label,
      this.windowDays,
      this.openRate,
      this.notes,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered enrollment profile in status idle. */
export function newTieredEnrollmentProfile(code: string, label: string): TieredEnrollmentProfile {
  return new TieredEnrollmentProfile(code, label, 0, 0, "", 0, "idle");
}
