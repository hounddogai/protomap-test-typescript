/**
 * The tiered creative override records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered creative override is in its life cycle. */
export type TieredCreativeOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered creative override. Its code is unique within a tenant. */
export class TieredCreativeOverride {
  code: string;
  title: string;
  timezone: string;
  margin: number;
  budget: number;
  sequence: number;
  name: string;
  checksum: string;
  status: TieredCreativeOverrideStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    margin: number,
    budget: number,
    sequence: number,
    name: string,
    checksum: string,
    status: TieredCreativeOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.margin = margin;
    this.budget = budget;
    this.sequence = sequence;
    this.name = name;
    this.checksum = checksum;
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

  canMoveTo(next: TieredCreativeOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredCreativeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered creative override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round(this.margin * this.budget * 100) / 100;
  }

  copy(): TieredCreativeOverride {
    return new TieredCreativeOverride(
      this.code,
      this.title,
      this.timezone,
      this.margin,
      this.budget,
      this.sequence,
      this.name,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered creative override in status planned. */
export function newTieredCreativeOverride(code: string, title: string): TieredCreativeOverride {
  return new TieredCreativeOverride(code, title, "", 0, 0, 0, "", "", "planned");
}
