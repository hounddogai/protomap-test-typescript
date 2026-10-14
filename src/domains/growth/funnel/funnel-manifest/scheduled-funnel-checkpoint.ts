import * as text from "../../../../kit/text.js";

/** Where a scheduled funnel checkpoint is in its life cycle. */
export type ScheduledFunnelCheckpointStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled funnel checkpoint and its current status. */
export class ScheduledFunnelCheckpoint {
  code: string;
  label: string;
  floorValue: number;
  notes: string;
  locale: string;
  margin: number;
  description: string;
  timezone: string;
  expiresAt: number;
  cohort: string;
  clicks: number;
  status: ScheduledFunnelCheckpointStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    notes: string,
    locale: string,
    margin: number,
    description: string,
    timezone: string,
    expiresAt: number,
    cohort: string,
    clicks: number,
    status: ScheduledFunnelCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.notes = notes;
    this.locale = locale;
    this.margin = margin;
    this.description = description;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledFunnelCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFunnelCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled funnel checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled funnel checkpoint"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.clicks * this.margin * 100) / 100;
  }

  copy(): ScheduledFunnelCheckpoint {
    return new ScheduledFunnelCheckpoint(
      this.code,
      this.label,
      this.floorValue,
      this.notes,
      this.locale,
      this.margin,
      this.description,
      this.timezone,
      this.expiresAt,
      this.cohort,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled funnel checkpoint in status created. */
export function newScheduledFunnelCheckpoint(code: string, label: string): ScheduledFunnelCheckpoint {
  return new ScheduledFunnelCheckpoint(code, label, 0, "", "", 0, "", "", 0, "", 0, "created");
}
