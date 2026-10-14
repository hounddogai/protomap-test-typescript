/**
 * The weighted warmup threshold records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted warmup threshold is in its life cycle. */
export type WeightedWarmupThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted warmup threshold. Its code is unique within a tenant. */
export class WeightedWarmupThreshold {
  code: string;
  label: string;
  region: string;
  conversionRate: number;
  source: string;
  ceiling: number;
  durationMinutes: number;
  phone: string;
  cost: number;
  checksum: string;
  frequencyCap: number;
  status: WeightedWarmupThresholdStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    conversionRate: number,
    source: string,
    ceiling: number,
    durationMinutes: number,
    phone: string,
    cost: number,
    checksum: string,
    frequencyCap: number,
    status: WeightedWarmupThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.conversionRate = conversionRate;
    this.source = source;
    this.ceiling = ceiling;
    this.durationMinutes = durationMinutes;
    this.phone = phone;
    this.cost = cost;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: WeightedWarmupThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedWarmupThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted warmup threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted warmup threshold"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.ceiling - this.durationMinutes) * 100) / 100;
  }

  copy(): WeightedWarmupThreshold {
    return new WeightedWarmupThreshold(
      this.code,
      this.label,
      this.region,
      this.conversionRate,
      this.source,
      this.ceiling,
      this.durationMinutes,
      this.phone,
      this.cost,
      this.checksum,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted warmup threshold in status planned. */
export function newWeightedWarmupThreshold(code: string, label: string): WeightedWarmupThreshold {
  return new WeightedWarmupThreshold(code, label, "", 0, "", 0, 0, "", 0, "", 0, "planned");
}
