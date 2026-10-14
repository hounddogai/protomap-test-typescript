/**
 * The badge profile records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge profile is in its life cycle. */
export type BadgeProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** One badge profile, with what the planners need to act on it. */
export class BadgeProfile {
  code: string;
  title: string;
  ceiling: number;
  durationMinutes: number;
  region: string;
  status: BadgeProfileStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    durationMinutes: number,
    region: string,
    status: BadgeProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.durationMinutes = durationMinutes;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BadgeProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.durationMinutes * this.ceiling * 100) / 100;
  }

  copy(): BadgeProfile {
    return new BadgeProfile(this.code, this.title, this.ceiling, this.durationMinutes, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a badge profile in status requested. */
export function newBadgeProfile(code: string, title: string): BadgeProfile {
  return new BadgeProfile(code, title, 0, 0, "", "requested");
}
