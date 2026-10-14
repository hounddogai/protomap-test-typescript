/**
 * The seasonal flight metric records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal flight metric is in its life cycle. */
export type SeasonalFlightMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a seasonal flight metric and its current status. */
export class SeasonalFlightMetric {
  code: string;
  title: string;
  variant: string;
  graceDays: number;
  frequencyCap: number;
  version: number;
  locale: string;
  attributes: Map<string, string>;
  updatedAt: number;
  checksum: string;
  retries: number;
  status: SeasonalFlightMetricStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    graceDays: number,
    frequencyCap: number,
    version: number,
    locale: string,
    attributes: Map<string, string>,
    updatedAt: number,
    checksum: string,
    retries: number,
    status: SeasonalFlightMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.graceDays = graceDays;
    this.frequencyCap = frequencyCap;
    this.version = version;
    this.locale = locale;
    this.attributes = attributes;
    this.updatedAt = updatedAt;
    this.checksum = checksum;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalFlightMetricStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SeasonalFlightMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal flight metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round(this.frequencyCap * this.graceDays * 100) / 100;
  }

  copy(): SeasonalFlightMetric {
    return new SeasonalFlightMetric(
      this.code,
      this.title,
      this.variant,
      this.graceDays,
      this.frequencyCap,
      this.version,
      this.locale,
      this.attributes,
      this.updatedAt,
      this.checksum,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal flight metric in status open. */
export function newSeasonalFlightMetric(code: string, title: string): SeasonalFlightMetric {
  return new SeasonalFlightMetric(code, title, "", 0, 0, 0, "", new Map<string, string>(), 0, "", 0, "open");
}
