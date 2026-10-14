/**
 * The macro segment records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro segment is in its life cycle. */
export type MacroSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One macro segment, with what the planners need to act on it. */
export class MacroSegment {
  code: string;
  label: string;
  floorValue: number;
  journeyId: string;
  updatedAt: number;
  region: string;
  createdAt: number;
  status: MacroSegmentStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    journeyId: string,
    updatedAt: number,
    region: string,
    createdAt: number,
    status: MacroSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.region = region;
    this.createdAt = createdAt;
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

  canMoveTo(next: MacroSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: MacroSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"macro segment"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.floorValue - this.updatedAt) * 100) / 100;
  }

  copy(): MacroSegment {
    return new MacroSegment(
      this.code,
      this.label,
      this.floorValue,
      this.journeyId,
      this.updatedAt,
      this.region,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a macro segment in status planned. */
export function newMacroSegment(code: string, label: string): MacroSegment {
  return new MacroSegment(code, label, 0, "", 0, "", 0, "planned");
}
