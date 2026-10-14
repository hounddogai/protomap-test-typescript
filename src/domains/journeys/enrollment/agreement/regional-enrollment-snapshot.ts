import * as text from "../../../../kit/text.js";

/** Where a regional enrollment snapshot is in its life cycle. */
export type RegionalEnrollmentSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a regional enrollment snapshot and its current status. */
export class RegionalEnrollmentSnapshot {
  code: string;
  title: string;
  capacity: number;
  threshold: number;
  channel: string;
  unit: string;
  createdAt: number;
  sendAt: number;
  floorValue: number;
  status: RegionalEnrollmentSnapshotStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    threshold: number,
    channel: string,
    unit: string,
    createdAt: number,
    sendAt: number,
    floorValue: number,
    status: RegionalEnrollmentSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.threshold = threshold;
    this.channel = channel;
    this.unit = unit;
    this.createdAt = createdAt;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
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

  canMoveTo(next: RegionalEnrollmentSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalEnrollmentSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional enrollment snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.sendAt - this.createdAt) * 100) / 100;
  }

  copy(): RegionalEnrollmentSnapshot {
    return new RegionalEnrollmentSnapshot(
      this.code,
      this.title,
      this.capacity,
      this.threshold,
      this.channel,
      this.unit,
      this.createdAt,
      this.sendAt,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional enrollment snapshot in status draft. */
export function newRegionalEnrollmentSnapshot(code: string, title: string): RegionalEnrollmentSnapshot {
  return new RegionalEnrollmentSnapshot(code, title, 0, 0, "", "", 0, 0, 0, "draft");
}
