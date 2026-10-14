/**
 * The complaint metric records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint metric is in its life cycle. */
export type ComplaintMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A complaint metric. Its code is unique within a tenant. */
export class ComplaintMetric {
  code: string;
  name: string;
  campaignRef: string;
  frequencyCap: number;
  active: boolean;
  externalRef: string;
  rate: number;
  floorValue: number;
  unit: string;
  variant: string;
  status: ComplaintMetricStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    frequencyCap: number,
    active: boolean,
    externalRef: string,
    rate: number,
    floorValue: number,
    unit: string,
    variant: string,
    status: ComplaintMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.active = active;
    this.externalRef = externalRef;
    this.rate = rate;
    this.floorValue = floorValue;
    this.unit = unit;
    this.variant = variant;
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

  canMoveTo(next: ComplaintMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
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

  moveTo(next: ComplaintMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.frequencyCap + this.floorValue) * 100) / 100;
  }

  copy(): ComplaintMetric {
    return new ComplaintMetric(
      this.code,
      this.name,
      this.campaignRef,
      this.frequencyCap,
      this.active,
      this.externalRef,
      this.rate,
      this.floorValue,
      this.unit,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a complaint metric in status draft. */
export function newComplaintMetric(code: string, name: string): ComplaintMetric {
  return new ComplaintMetric(code, name, "", 0, false, "", 0, 0, "", "", "draft");
}
