/**
 * The deflection metric records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection metric is in its life cycle. */
export type DeflectionMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** A deflection metric. Its code is unique within a tenant. */
export class DeflectionMetric {
  code: string;
  label: string;
  endsAt: number;
  cohort: string;
  ratio: number;
  status: DeflectionMetricStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    cohort: string,
    ratio: number,
    status: DeflectionMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.cohort = cohort;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionMetricStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedExposure(): number {
    return Math.round((this.endsAt - this.ratio) * 100) / 100;
  }

  copy(): DeflectionMetric {
    return new DeflectionMetric(this.code, this.label, this.endsAt, this.cohort, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a deflection metric in status new. */
export function newDeflectionMetric(code: string, label: string): DeflectionMetric {
  return new DeflectionMetric(code, label, 0, "", 0, "new");
}
