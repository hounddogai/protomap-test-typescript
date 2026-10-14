/**
 * The scheduled creative preference records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled creative preference is in its life cycle. */
export type ScheduledCreativePreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled creative preference as the creative team keeps it. */
export class ScheduledCreativePreference {
  code: string;
  label: string;
  approved: boolean;
  unit: string;
  attempts: number;
  campaignRef: string;
  ratio: number;
  country: string;
  locale: string;
  status: ScheduledCreativePreferenceStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    unit: string,
    attempts: number,
    campaignRef: string,
    ratio: number,
    country: string,
    locale: string,
    status: ScheduledCreativePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.unit = unit;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.country = country;
    this.locale = locale;
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

  canMoveTo(next: ScheduledCreativePreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: ScheduledCreativePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled creative preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.attempts + this.ratio) * 100) / 100;
  }

  copy(): ScheduledCreativePreference {
    return new ScheduledCreativePreference(
      this.code,
      this.label,
      this.approved,
      this.unit,
      this.attempts,
      this.campaignRef,
      this.ratio,
      this.country,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled creative preference in status draft. */
export function newScheduledCreativePreference(code: string, label: string): ScheduledCreativePreference {
  return new ScheduledCreativePreference(code, label, false, "", 0, "", 0, "", "", "draft");
}
