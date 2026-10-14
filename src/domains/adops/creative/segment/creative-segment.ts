/**
 * The creative segment records of adops's creative work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative segment is in its life cycle. */
export type CreativeSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A creative segment as the creative team keeps it. */
export class CreativeSegment {
  code: string;
  title: string;
  notes: string;
  impressions: number;
  windowDays: number;
  frequencyCap: number;
  timezone: string;
  status: CreativeSegmentStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    impressions: number,
    windowDays: number,
    frequencyCap: number,
    timezone: string,
    status: CreativeSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.frequencyCap = frequencyCap;
    this.timezone = timezone;
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

  canMoveTo(next: CreativeSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreativeSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.windowDays - this.frequencyCap) * 100) / 100;
  }

  copy(): CreativeSegment {
    return new CreativeSegment(
      this.code,
      this.title,
      this.notes,
      this.impressions,
      this.windowDays,
      this.frequencyCap,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a creative segment in status planned. */
export function newCreativeSegment(code: string, title: string): CreativeSegment {
  return new CreativeSegment(code, title, "", 0, 0, 0, "", "planned");
}
