/**
 * The level profile records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level profile is in its life cycle. */
export type LevelProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a level profile and its current status. */
export class LevelProfile {
  code: string;
  title: string;
  source: string;
  phone: string;
  durationMinutes: number;
  ratio: number;
  archived: boolean;
  ceiling: number;
  currency: string;
  capacity: number;
  status: LevelProfileStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    phone: string,
    durationMinutes: number,
    ratio: number,
    archived: boolean,
    ceiling: number,
    currency: string,
    capacity: number,
    status: LevelProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.phone = phone;
    this.durationMinutes = durationMinutes;
    this.ratio = ratio;
    this.archived = archived;
    this.ceiling = ceiling;
    this.currency = currency;
    this.capacity = capacity;
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

  canMoveTo(next: LevelProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LevelProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.capacity * this.ceiling * 100) / 100;
  }

  copy(): LevelProfile {
    return new LevelProfile(
      this.code,
      this.title,
      this.source,
      this.phone,
      this.durationMinutes,
      this.ratio,
      this.archived,
      this.ceiling,
      this.currency,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a level profile in status planned. */
export function newLevelProfile(code: string, title: string): LevelProfile {
  return new LevelProfile(code, title, "", "", 0, 0, false, 0, "", 0, "planned");
}
