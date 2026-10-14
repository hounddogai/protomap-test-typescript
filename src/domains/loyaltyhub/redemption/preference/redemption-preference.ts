/**
 * The redemption preference records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption preference is in its life cycle. */
export type RedemptionPreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A redemption preference. Its code is unique within a tenant. */
export class RedemptionPreference {
  code: string;
  title: string;
  unit: string;
  budget: number;
  active: boolean;
  durationMinutes: number;
  ratio: number;
  status: RedemptionPreferenceStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    budget: number,
    active: boolean,
    durationMinutes: number,
    ratio: number,
    status: RedemptionPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.budget = budget;
    this.active = active;
    this.durationMinutes = durationMinutes;
    this.ratio = ratio;
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

  canMoveTo(next: RedemptionPreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netTotal(): number {
    return Math.round((this.durationMinutes - this.ratio) * 100) / 100;
  }

  copy(): RedemptionPreference {
    return new RedemptionPreference(
      this.code,
      this.title,
      this.unit,
      this.budget,
      this.active,
      this.durationMinutes,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a redemption preference in status draft. */
export function newRedemptionPreference(code: string, title: string): RedemptionPreference {
  return new RedemptionPreference(code, title, "", 0, false, 0, 0, "draft");
}
