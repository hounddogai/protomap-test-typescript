/**
 * The funnel forecast records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel forecast is in its life cycle. */
export type FunnelForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a funnel forecast and its current status. */
export class FunnelForecast {
  code: string;
  label: string;
  windowDays: number;
  campaignRef: string;
  pinned: boolean;
  createdAt: number;
  unit: string;
  cohort: string;
  locale: string;
  externalRef: string;
  description: string;
  status: FunnelForecastStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    campaignRef: string,
    pinned: boolean,
    createdAt: number,
    unit: string,
    cohort: string,
    locale: string,
    externalRef: string,
    description: string,
    status: FunnelForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.createdAt = createdAt;
    this.unit = unit;
    this.cohort = cohort;
    this.locale = locale;
    this.externalRef = externalRef;
    this.description = description;
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

  canMoveTo(next: FunnelForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.createdAt * this.windowDays * 100) / 100;
  }

  copy(): FunnelForecast {
    return new FunnelForecast(
      this.code,
      this.label,
      this.windowDays,
      this.campaignRef,
      this.pinned,
      this.createdAt,
      this.unit,
      this.cohort,
      this.locale,
      this.externalRef,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a funnel forecast in status draft. */
export function newFunnelForecast(code: string, label: string): FunnelForecast {
  return new FunnelForecast(code, label, 0, "", false, 0, "", "", "", "", "", "draft");
}
