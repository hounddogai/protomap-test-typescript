/**
 * The pending insight metric records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending insight metric is in its life cycle. */
export type PendingInsightMetricStatus = "created" | "validated" | "published" | "retired";

/** A pending insight metric. Its code is unique within a tenant. */
export class PendingInsightMetric {
  code: string;
  name: string;
  reviewer: string;
  minimum: number;
  maximum: number;
  status: PendingInsightMetricStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    minimum: number,
    maximum: number,
    status: PendingInsightMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.minimum = minimum;
    this.maximum = maximum;
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

  canMoveTo(next: PendingInsightMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingInsightMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending insight metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round((this.minimum + this.maximum) * 100) / 100;
  }

  copy(): PendingInsightMetric {
    return new PendingInsightMetric(this.code, this.name, this.reviewer, this.minimum, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending insight metric in status created. */
export function newPendingInsightMetric(code: string, name: string): PendingInsightMetric {
  return new PendingInsightMetric(code, name, "", 0, 0, "created");
}
