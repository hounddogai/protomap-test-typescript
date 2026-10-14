/**
 * The seasonal csat template records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal csat template is in its life cycle. */
export type SeasonalCsatTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a seasonal csat template and its current status. */
export class SeasonalCsatTemplate {
  code: string;
  label: string;
  journeyId: string;
  notes: string;
  country: string;
  weight: number;
  conversionRate: number;
  rate: number;
  locale: string;
  visible: boolean;
  floorValue: number;
  status: SeasonalCsatTemplateStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    notes: string,
    country: string,
    weight: number,
    conversionRate: number,
    rate: number,
    locale: string,
    visible: boolean,
    floorValue: number,
    status: SeasonalCsatTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.notes = notes;
    this.country = country;
    this.weight = weight;
    this.conversionRate = conversionRate;
    this.rate = rate;
    this.locale = locale;
    this.visible = visible;
    this.floorValue = floorValue;
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

  canMoveTo(next: SeasonalCsatTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "closed";
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

  moveTo(next: SeasonalCsatTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal csat template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.weight * this.floorValue * 100) / 100;
  }

  copy(): SeasonalCsatTemplate {
    return new SeasonalCsatTemplate(
      this.code,
      this.label,
      this.journeyId,
      this.notes,
      this.country,
      this.weight,
      this.conversionRate,
      this.rate,
      this.locale,
      this.visible,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal csat template in status draft. */
export function newSeasonalCsatTemplate(code: string, label: string): SeasonalCsatTemplate {
  return new SeasonalCsatTemplate(code, label, "", "", "", 0, 0, 0, "", false, 0, "draft");
}
