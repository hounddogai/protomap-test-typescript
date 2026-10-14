import * as text from "../../../../kit/text.js";

/** Where a manual pacing reservation is in its life cycle. */
export type ManualPacingReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual pacing reservation. Its code is unique within a tenant. */
export class ManualPacingReservation {
  code: string;
  title: string;
  openRate: number;
  durationMinutes: number;
  source: string;
  revision: number;
  capacity: number;
  timezone: string;
  summary: string;
  version: number;
  status: ManualPacingReservationStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    durationMinutes: number,
    source: string,
    revision: number,
    capacity: number,
    timezone: string,
    summary: string,
    version: number,
    status: ManualPacingReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.source = source;
    this.revision = revision;
    this.capacity = capacity;
    this.timezone = timezone;
    this.summary = summary;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualPacingReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualPacingReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual pacing reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"manual pacing reservation"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.durationMinutes - this.version) * 100) / 100;
  }

  copy(): ManualPacingReservation {
    return new ManualPacingReservation(
      this.code,
      this.title,
      this.openRate,
      this.durationMinutes,
      this.source,
      this.revision,
      this.capacity,
      this.timezone,
      this.summary,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual pacing reservation in status planned. */
export function newManualPacingReservation(code: string, title: string): ManualPacingReservation {
  return new ManualPacingReservation(code, title, 0, 0, "", 0, 0, "", "", 0, "planned");
}
