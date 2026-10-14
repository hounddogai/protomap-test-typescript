/**
 * The weighted warmup allocation records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted warmup allocation is in its life cycle. */
export type WeightedWarmupAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** One weighted warmup allocation, with what the planners need to act on it. */
export class WeightedWarmupAllocation {
  code: string;
  label: string;
  variant: string;
  title: string;
  phone: string;
  category: string;
  amount: number;
  status: WeightedWarmupAllocationStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    title: string,
    phone: string,
    category: string,
    amount: number,
    status: WeightedWarmupAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.title = title;
    this.phone = phone;
    this.category = category;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedWarmupAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WeightedWarmupAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted warmup allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): WeightedWarmupAllocation {
    return new WeightedWarmupAllocation(
      this.code,
      this.label,
      this.variant,
      this.title,
      this.phone,
      this.category,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted warmup allocation in status requested. */
export function newWeightedWarmupAllocation(code: string, label: string): WeightedWarmupAllocation {
  return new WeightedWarmupAllocation(code, label, "", "", "", "", 0, "requested");
}
