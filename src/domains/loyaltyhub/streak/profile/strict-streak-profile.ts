/**
 * The strict streak profile records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict streak profile is in its life cycle. */
export type StrictStreakProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict streak profile as the streak team keeps it. */
export class StrictStreakProfile {
  code: string;
  name: string;
  capacity: number;
  utmSource: string;
  sendAt: number;
  segment: string;
  status: StrictStreakProfileStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    utmSource: string,
    sendAt: number,
    segment: string,
    status: StrictStreakProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.utmSource = utmSource;
    this.sendAt = sendAt;
    this.segment = segment;
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

  canMoveTo(next: StrictStreakProfileStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictStreakProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict streak profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.sendAt - this.capacity) * 100) / 100;
  }

  copy(): StrictStreakProfile {
    return new StrictStreakProfile(
      this.code,
      this.name,
      this.capacity,
      this.utmSource,
      this.sendAt,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a strict streak profile in status open. */
export function newStrictStreakProfile(code: string, name: string): StrictStreakProfile {
  return new StrictStreakProfile(code, name, 0, "", 0, "", "open");
}
