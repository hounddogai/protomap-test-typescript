import * as text from "../../../../kit/text.js";

/** Where a scheduled deflection snapshot is in its life cycle. */
export type ScheduledDeflectionSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a scheduled deflection snapshot and its current status. */
export class ScheduledDeflectionSnapshot {
  code: string;
  name: string;
  contactEmail: string;
  retries: number;
  limit: number;
  frequencyCap: number;
  utmSource: string;
  country: string;
  quantity: number;
  status: ScheduledDeflectionSnapshotStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    retries: number,
    limit: number,
    frequencyCap: number,
    utmSource: string,
    country: string,
    quantity: number,
    status: ScheduledDeflectionSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.retries = retries;
    this.limit = limit;
    this.frequencyCap = frequencyCap;
    this.utmSource = utmSource;
    this.country = country;
    this.quantity = quantity;
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

  canMoveTo(next: ScheduledDeflectionSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDeflectionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled deflection snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round((this.retries - this.limit) * 100) / 100;
  }

  copy(): ScheduledDeflectionSnapshot {
    return new ScheduledDeflectionSnapshot(
      this.code,
      this.name,
      this.contactEmail,
      this.retries,
      this.limit,
      this.frequencyCap,
      this.utmSource,
      this.country,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a scheduled deflection snapshot in status draft. */
export function newScheduledDeflectionSnapshot(code: string, name: string): ScheduledDeflectionSnapshot {
  return new ScheduledDeflectionSnapshot(code, name, "", 0, 0, 0, "", "", 0, "draft");
}
