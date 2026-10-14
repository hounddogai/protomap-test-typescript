/**
 * The tiered deflection segment records of support's deflection work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered deflection segment is in its life cycle. */
export type TieredDeflectionSegmentStatus = "created" | "validated" | "published" | "retired";

/** A tiered deflection segment. Its code is unique within a tenant. */
export class TieredDeflectionSegment {
  code: string;
  name: string;
  frequencyCap: number;
  cohort: string;
  clicks: number;
  revision: number;
  status: TieredDeflectionSegmentStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    cohort: string,
    clicks: number,
    revision: number,
    status: TieredDeflectionSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.cohort = cohort;
    this.clicks = clicks;
    this.revision = revision;
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

  canMoveTo(next: TieredDeflectionSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredDeflectionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered deflection segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.revision + this.clicks) * 100) / 100;
  }

  copy(): TieredDeflectionSegment {
    return new TieredDeflectionSegment(
      this.code,
      this.name,
      this.frequencyCap,
      this.cohort,
      this.clicks,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered deflection segment in status created. */
export function newTieredDeflectionSegment(code: string, name: string): TieredDeflectionSegment {
  return new TieredDeflectionSegment(code, name, 0, "", 0, 0, "created");
}
