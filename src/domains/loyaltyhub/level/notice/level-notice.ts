/**
 * The level notice records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level notice is in its life cycle. */
export type LevelNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a level notice and its current status. */
export class LevelNotice {
  code: string;
  label: string;
  startsAt: number;
  active: boolean;
  ceiling: number;
  variant: string;
  reviewer: string;
  sequence: number;
  impressions: number;
  status: LevelNoticeStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    active: boolean,
    ceiling: number,
    variant: string,
    reviewer: string,
    sequence: number,
    impressions: number,
    status: LevelNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.active = active;
    this.ceiling = ceiling;
    this.variant = variant;
    this.reviewer = reviewer;
    this.sequence = sequence;
    this.impressions = impressions;
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

  canMoveTo(next: LevelNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LevelNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round(this.sequence * this.startsAt * 100) / 100;
  }

  copy(): LevelNotice {
    return new LevelNotice(
      this.code,
      this.label,
      this.startsAt,
      this.active,
      this.ceiling,
      this.variant,
      this.reviewer,
      this.sequence,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a level notice in status planned. */
export function newLevelNotice(code: string, label: string): LevelNotice {
  return new LevelNotice(code, label, 0, false, 0, "", "", 0, 0, "planned");
}
