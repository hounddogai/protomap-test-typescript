import * as text from "../../../../kit/text.js";

/** Where a rolling path mapping is in its life cycle. */
export type RollingPathMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling path mapping and its current status. */
export class RollingPathMapping {
  code: string;
  label: string;
  bid: number;
  conversionRate: number;
  rate: number;
  frequencyCap: number;
  updatedAt: number;
  name: string;
  capacity: number;
  cohort: string;
  version: number;
  status: RollingPathMappingStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    conversionRate: number,
    rate: number,
    frequencyCap: number,
    updatedAt: number,
    name: string,
    capacity: number,
    cohort: string,
    version: number,
    status: RollingPathMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.conversionRate = conversionRate;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.updatedAt = updatedAt;
    this.name = name;
    this.capacity = capacity;
    this.cohort = cohort;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingPathMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPathMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling path mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"rolling path mapping"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.conversionRate - this.bid) * 100) / 100;
  }

  copy(): RollingPathMapping {
    return new RollingPathMapping(
      this.code,
      this.label,
      this.bid,
      this.conversionRate,
      this.rate,
      this.frequencyCap,
      this.updatedAt,
      this.name,
      this.capacity,
      this.cohort,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling path mapping in status open. */
export function newRollingPathMapping(code: string, label: string): RollingPathMapping {
  return new RollingPathMapping(code, label, 0, 0, 0, 0, 0, "", 0, "", 0, "open");
}
