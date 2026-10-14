/**
 * The legacy level tier records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy level tier is in its life cycle. */
export type LegacyLevelTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One legacy level tier, with what the planners need to act on it. */
export class LegacyLevelTier {
  code: string;
  title: string;
  weight: number;
  startsAt: number;
  active: boolean;
  rate: number;
  summary: string;
  version: number;
  description: string;
  status: LegacyLevelTierStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    startsAt: number,
    active: boolean,
    rate: number,
    summary: string,
    version: number,
    description: string,
    status: LegacyLevelTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.startsAt = startsAt;
    this.active = active;
    this.rate = rate;
    this.summary = summary;
    this.version = version;
    this.description = description;
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

  canMoveTo(next: LegacyLevelTierStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LegacyLevelTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy level tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"legacy level tier"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.startsAt + this.rate) * 100) / 100;
  }

  copy(): LegacyLevelTier {
    return new LegacyLevelTier(
      this.code,
      this.title,
      this.weight,
      this.startsAt,
      this.active,
      this.rate,
      this.summary,
      this.version,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy level tier in status planned. */
export function newLegacyLevelTier(code: string, title: string): LegacyLevelTier {
  return new LegacyLevelTier(code, title, 0, 0, false, 0, "", 0, "", "planned");
}
