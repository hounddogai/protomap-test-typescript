/**
 * The seasonal macro profile records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal macro profile is in its life cycle. */
export type SeasonalMacroProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal macro profile as the macro team keeps it. */
export class SeasonalMacroProfile {
  code: string;
  title: string;
  expiresAt: number;
  timezone: string;
  revision: number;
  unit: string;
  ratio: number;
  budget: number;
  openRate: number;
  currency: string;
  status: SeasonalMacroProfileStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    timezone: string,
    revision: number,
    unit: string,
    ratio: number,
    budget: number,
    openRate: number,
    currency: string,
    status: SeasonalMacroProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.timezone = timezone;
    this.revision = revision;
    this.unit = unit;
    this.ratio = ratio;
    this.budget = budget;
    this.openRate = openRate;
    this.currency = currency;
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

  canMoveTo(next: SeasonalMacroProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SeasonalMacroProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal macro profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round(this.budget * this.expiresAt * 100) / 100;
  }

  copy(): SeasonalMacroProfile {
    return new SeasonalMacroProfile(
      this.code,
      this.title,
      this.expiresAt,
      this.timezone,
      this.revision,
      this.unit,
      this.ratio,
      this.budget,
      this.openRate,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a seasonal macro profile in status planned. */
export function newSeasonalMacroProfile(code: string, title: string): SeasonalMacroProfile {
  return new SeasonalMacroProfile(code, title, 0, "", 0, "", 0, 0, 0, "", "planned");
}
