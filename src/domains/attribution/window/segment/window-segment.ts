/**
 * The window segment records of attribution's window work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window segment is in its life cycle. */
export type WindowSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A window segment. Its code is unique within a tenant. */
export class WindowSegment {
  code: string;
  name: string;
  budget: number;
  capacity: number;
  contactEmail: string;
  checksum: string;
  limit: number;
  floorValue: number;
  durationMinutes: number;
  source: string;
  utmSource: string;
  status: WindowSegmentStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    capacity: number,
    contactEmail: string,
    checksum: string,
    limit: number,
    floorValue: number,
    durationMinutes: number,
    source: string,
    utmSource: string,
    status: WindowSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.limit = limit;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.source = source;
    this.utmSource = utmSource;
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

  canMoveTo(next: WindowSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.floorValue + this.limit) * 100) / 100;
  }

  copy(): WindowSegment {
    return new WindowSegment(
      this.code,
      this.name,
      this.budget,
      this.capacity,
      this.contactEmail,
      this.checksum,
      this.limit,
      this.floorValue,
      this.durationMinutes,
      this.source,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a window segment in status planned. */
export function newWindowSegment(code: string, name: string): WindowSegment {
  return new WindowSegment(code, name, 0, 0, "", "", 0, 0, 0, "", "", "planned");
}
