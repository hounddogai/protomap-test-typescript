/**
 * The level claim records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level claim is in its life cycle. */
export type LevelClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A level claim as the level team keeps it. */
export class LevelClaim {
  code: string;
  title: string;
  version: number;
  phone: string;
  timezone: string;
  label: string;
  openRate: number;
  attempts: number;
  startsAt: number;
  status: LevelClaimStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    phone: string,
    timezone: string,
    label: string,
    openRate: number,
    attempts: number,
    startsAt: number,
    status: LevelClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.phone = phone;
    this.timezone = timezone;
    this.label = label;
    this.openRate = openRate;
    this.attempts = attempts;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.version - this.openRate) * 100) / 100;
  }

  copy(): LevelClaim {
    return new LevelClaim(
      this.code,
      this.title,
      this.version,
      this.phone,
      this.timezone,
      this.label,
      this.openRate,
      this.attempts,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a level claim in status proposed. */
export function newLevelClaim(code: string, title: string): LevelClaim {
  return new LevelClaim(code, title, 0, "", "", "", 0, 0, 0, "proposed");
}
