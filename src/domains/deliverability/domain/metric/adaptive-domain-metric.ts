/**
 * The adaptive domain metric records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive domain metric is in its life cycle. */
export type AdaptiveDomainMetricStatus = "created" | "validated" | "published" | "retired";

/** The record of a adaptive domain metric and its current status. */
export class AdaptiveDomainMetric {
  code: string;
  name: string;
  budget: number;
  utmSource: string;
  margin: number;
  summary: string;
  phone: string;
  unit: string;
  status: AdaptiveDomainMetricStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    utmSource: string,
    margin: number,
    summary: string,
    phone: string,
    unit: string,
    status: AdaptiveDomainMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.utmSource = utmSource;
    this.margin = margin;
    this.summary = summary;
    this.phone = phone;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveDomainMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveDomainMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive domain metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive domain metric"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.margin + this.budget) * 100) / 100;
  }

  copy(): AdaptiveDomainMetric {
    return new AdaptiveDomainMetric(
      this.code,
      this.name,
      this.budget,
      this.utmSource,
      this.margin,
      this.summary,
      this.phone,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive domain metric in status created. */
export function newAdaptiveDomainMetric(code: string, name: string): AdaptiveDomainMetric {
  return new AdaptiveDomainMetric(code, name, 0, "", 0, "", "", "", "created");
}
