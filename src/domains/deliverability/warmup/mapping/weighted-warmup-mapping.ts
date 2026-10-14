/**
 * The weighted warmup mapping records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted warmup mapping is in its life cycle. */
export type WeightedWarmupMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted warmup mapping, with what the planners need to act on it. */
export class WeightedWarmupMapping {
  code: string;
  name: string;
  externalRef: string;
  frequencyCap: number;
  limit: number;
  pinned: boolean;
  phone: string;
  conversionRate: number;
  attempts: number;
  status: WeightedWarmupMappingStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    frequencyCap: number,
    limit: number,
    pinned: boolean,
    phone: string,
    conversionRate: number,
    attempts: number,
    status: WeightedWarmupMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.pinned = pinned;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedWarmupMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedWarmupMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted warmup mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted warmup mapping"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.frequencyCap * this.limit * 100) / 100;
  }

  copy(): WeightedWarmupMapping {
    return new WeightedWarmupMapping(
      this.code,
      this.name,
      this.externalRef,
      this.frequencyCap,
      this.limit,
      this.pinned,
      this.phone,
      this.conversionRate,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted warmup mapping in status proposed. */
export function newWeightedWarmupMapping(code: string, name: string): WeightedWarmupMapping {
  return new WeightedWarmupMapping(code, name, "", 0, 0, false, "", 0, 0, "proposed");
}
