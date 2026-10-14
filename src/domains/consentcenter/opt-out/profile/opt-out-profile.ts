/**
 * The opt out profile records of consentcenter's opt out work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out profile is in its life cycle. */
export type OptOutProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a opt out profile and its current status. */
export class OptOutProfile {
  code: string;
  title: string;
  locale: string;
  active: boolean;
  impressions: number;
  conversionRate: number;
  batchSize: number;
  unit: string;
  status: OptOutProfileStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    active: boolean,
    impressions: number,
    conversionRate: number,
    batchSize: number,
    unit: string,
    status: OptOutProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.active = active;
    this.impressions = impressions;
    this.conversionRate = conversionRate;
    this.batchSize = batchSize;
    this.unit = unit;
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

  canMoveTo(next: OptOutProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: OptOutProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round((this.batchSize + this.impressions) * 100) / 100;
  }

  copy(): OptOutProfile {
    return new OptOutProfile(
      this.code,
      this.title,
      this.locale,
      this.active,
      this.impressions,
      this.conversionRate,
      this.batchSize,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a opt out profile in status draft. */
export function newOptOutProfile(code: string, title: string): OptOutProfile {
  return new OptOutProfile(code, title, "", false, 0, 0, 0, "", "draft");
}
