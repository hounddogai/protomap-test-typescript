import * as text from "../../../../kit/text.js";

/** Where a primary conversion snapshot is in its life cycle. */
export type PrimaryConversionSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary conversion snapshot. Its code is unique within a tenant. */
export class PrimaryConversionSnapshot {
  code: string;
  label: string;
  visible: boolean;
  limit: number;
  windowDays: number;
  source: string;
  startsAt: number;
  priority: number;
  category: string;
  phone: string;
  status: PrimaryConversionSnapshotStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    limit: number,
    windowDays: number,
    source: string,
    startsAt: number,
    priority: number,
    category: string,
    phone: string,
    status: PrimaryConversionSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.limit = limit;
    this.windowDays = windowDays;
    this.source = source;
    this.startsAt = startsAt;
    this.priority = priority;
    this.category = category;
    this.phone = phone;
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

  canMoveTo(next: PrimaryConversionSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PrimaryConversionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary conversion snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.priority + this.windowDays) * 100) / 100;
  }

  copy(): PrimaryConversionSnapshot {
    return new PrimaryConversionSnapshot(
      this.code,
      this.label,
      this.visible,
      this.limit,
      this.windowDays,
      this.source,
      this.startsAt,
      this.priority,
      this.category,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary conversion snapshot in status planned. */
export function newPrimaryConversionSnapshot(code: string, label: string): PrimaryConversionSnapshot {
  return new PrimaryConversionSnapshot(code, label, false, 0, 0, "", 0, 0, "", "", "planned");
}
