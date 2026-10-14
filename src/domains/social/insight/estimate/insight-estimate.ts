/**
 * The insight estimate records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight estimate is in its life cycle. */
export type InsightEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A insight estimate. Its code is unique within a tenant. */
export class InsightEstimate {
  code: string;
  label: string;
  locale: string;
  description: string;
  batchSize: number;
  conversionRate: number;
  startsAt: number;
  retries: number;
  status: InsightEstimateStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    description: string,
    batchSize: number,
    conversionRate: number,
    startsAt: number,
    retries: number,
    status: InsightEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.description = description;
    this.batchSize = batchSize;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
    this.retries = retries;
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

  canMoveTo(next: InsightEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
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

  moveTo(next: InsightEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"insight estimate"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.retries * this.conversionRate * 100) / 100;
  }

  copy(): InsightEstimate {
    return new InsightEstimate(
      this.code,
      this.label,
      this.locale,
      this.description,
      this.batchSize,
      this.conversionRate,
      this.startsAt,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a insight estimate in status draft. */
export function newInsightEstimate(code: string, label: string): InsightEstimate {
  return new InsightEstimate(code, label, "", "", 0, 0, 0, 0, "draft");
}
