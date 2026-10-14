/**
 * The level mapping records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level mapping is in its life cycle. */
export type LevelMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A level mapping as the level team keeps it. */
export class LevelMapping {
  code: string;
  name: string;
  conversionRate: number;
  unit: string;
  archived: boolean;
  budget: number;
  checksum: string;
  status: LevelMappingStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    unit: string,
    archived: boolean,
    budget: number,
    checksum: string,
    status: LevelMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.unit = unit;
    this.archived = archived;
    this.budget = budget;
    this.checksum = checksum;
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

  canMoveTo(next: LevelMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "closed":
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

  moveTo(next: LevelMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"level mapping"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.conversionRate - this.budget) * 100) / 100;
  }

  copy(): LevelMapping {
    return new LevelMapping(
      this.code,
      this.name,
      this.conversionRate,
      this.unit,
      this.archived,
      this.budget,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a level mapping in status draft. */
export function newLevelMapping(code: string, name: string): LevelMapping {
  return new LevelMapping(code, name, 0, "", false, 0, "", "draft");
}
