/**
 * The scheduled pacing target records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled pacing target is in its life cycle. */
export type ScheduledPacingTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled pacing target. Its code is unique within a tenant. */
export class ScheduledPacingTarget {
  code: string;
  title: string;
  clicks: number;
  locale: string;
  durationMinutes: number;
  startsAt: number;
  variant: string;
  openRate: number;
  status: ScheduledPacingTargetStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    locale: string,
    durationMinutes: number,
    startsAt: number,
    variant: string,
    openRate: number,
    status: ScheduledPacingTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.startsAt = startsAt;
    this.variant = variant;
    this.openRate = openRate;
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

  canMoveTo(next: ScheduledPacingTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
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

  moveTo(next: ScheduledPacingTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled pacing target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.durationMinutes - this.startsAt) * 100) / 100;
  }

  copy(): ScheduledPacingTarget {
    return new ScheduledPacingTarget(
      this.code,
      this.title,
      this.clicks,
      this.locale,
      this.durationMinutes,
      this.startsAt,
      this.variant,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled pacing target in status proposed. */
export function newScheduledPacingTarget(code: string, title: string): ScheduledPacingTarget {
  return new ScheduledPacingTarget(code, title, 0, "", 0, 0, "", 0, "proposed");
}
