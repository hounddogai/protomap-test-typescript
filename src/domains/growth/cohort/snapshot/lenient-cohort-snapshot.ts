/**
 * The lenient cohort snapshot records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient cohort snapshot is in its life cycle. */
export type LenientCohortSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient cohort snapshot. Its code is unique within a tenant. */
export class LenientCohortSnapshot {
  code: string;
  name: string;
  margin: number;
  floorValue: number;
  attributes: Map<string, string>;
  durationMinutes: number;
  unit: string;
  campaignRef: string;
  status: LenientCohortSnapshotStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    floorValue: number,
    attributes: Map<string, string>,
    durationMinutes: number,
    unit: string,
    campaignRef: string,
    status: LenientCohortSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.floorValue = floorValue;
    this.attributes = attributes;
    this.durationMinutes = durationMinutes;
    this.unit = unit;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: LenientCohortSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LenientCohortSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient cohort snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient cohort snapshot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round((this.durationMinutes - this.margin) * 100) / 100;
  }

  copy(): LenientCohortSnapshot {
    return new LenientCohortSnapshot(
      this.code,
      this.name,
      this.margin,
      this.floorValue,
      this.attributes,
      this.durationMinutes,
      this.unit,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient cohort snapshot in status draft. */
export function newLenientCohortSnapshot(code: string, name: string): LenientCohortSnapshot {
  return new LenientCohortSnapshot(code, name, 0, 0, new Map<string, string>(), 0, "", "", "draft");
}
