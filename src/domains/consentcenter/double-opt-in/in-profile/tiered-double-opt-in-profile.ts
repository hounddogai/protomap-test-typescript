/**
 * The tiered double opt in profile records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered double opt in profile is in its life cycle. */
export type TieredDoubleOptInProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One tiered double opt in profile, with what the planners need to act on it. */
export class TieredDoubleOptInProfile {
  code: string;
  label: string;
  limit: number;
  archived: boolean;
  frequencyCap: number;
  budget: number;
  country: string;
  priority: number;
  status: TieredDoubleOptInProfileStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    archived: boolean,
    frequencyCap: number,
    budget: number,
    country: string,
    priority: number,
    status: TieredDoubleOptInProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.archived = archived;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.country = country;
    this.priority = priority;
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

  canMoveTo(next: TieredDoubleOptInProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredDoubleOptInProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered double opt in profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.limit + this.budget) * 100) / 100;
  }

  copy(): TieredDoubleOptInProfile {
    return new TieredDoubleOptInProfile(
      this.code,
      this.label,
      this.limit,
      this.archived,
      this.frequencyCap,
      this.budget,
      this.country,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered double opt in profile in status planned. */
export function newTieredDoubleOptInProfile(code: string, label: string): TieredDoubleOptInProfile {
  return new TieredDoubleOptInProfile(code, label, 0, false, 0, 0, "", 0, "planned");
}
