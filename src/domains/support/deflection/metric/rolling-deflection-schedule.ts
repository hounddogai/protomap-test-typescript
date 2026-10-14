import * as text from "../../../../kit/text.js";

/** Where a rolling deflection schedule is in its life cycle. */
export type RollingDeflectionScheduleStatus = "created" | "validated" | "published" | "retired";

/** A rolling deflection schedule. Its code is unique within a tenant. */
export class RollingDeflectionSchedule {
  code: string;
  label: string;
  weight: number;
  limit: number;
  pinned: boolean;
  floorValue: number;
  locale: string;
  version: number;
  unit: string;
  status: RollingDeflectionScheduleStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    limit: number,
    pinned: boolean,
    floorValue: number,
    locale: string,
    version: number,
    unit: string,
    status: RollingDeflectionScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.limit = limit;
    this.pinned = pinned;
    this.floorValue = floorValue;
    this.locale = locale;
    this.version = version;
    this.unit = unit;
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

  canMoveTo(next: RollingDeflectionScheduleStatus): boolean {
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
          case "retired":
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

  moveTo(next: RollingDeflectionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling deflection schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.weight - this.version) * 100) / 100;
  }

  copy(): RollingDeflectionSchedule {
    return new RollingDeflectionSchedule(
      this.code,
      this.label,
      this.weight,
      this.limit,
      this.pinned,
      this.floorValue,
      this.locale,
      this.version,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling deflection schedule in status created. */
export function newRollingDeflectionSchedule(code: string, label: string): RollingDeflectionSchedule {
  return new RollingDeflectionSchedule(code, label, 0, 0, false, 0, "", 0, "", "created");
}
