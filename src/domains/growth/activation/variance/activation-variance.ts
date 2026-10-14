/**
 * The activation variance records of growth's activation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation variance is in its life cycle. */
export type ActivationVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One activation variance, with what the planners need to act on it. */
export class ActivationVariance {
  code: string;
  name: string;
  conversionRate: number;
  phone: string;
  threshold: number;
  summary: string;
  cost: number;
  quantity: number;
  status: ActivationVarianceStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    phone: string,
    threshold: number,
    summary: string,
    cost: number,
    quantity: number,
    status: ActivationVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.phone = phone;
    this.threshold = threshold;
    this.summary = summary;
    this.cost = cost;
    this.quantity = quantity;
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

  canMoveTo(next: ActivationVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: ActivationVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.quantity + this.cost) * 100) / 100;
  }

  copy(): ActivationVariance {
    return new ActivationVariance(
      this.code,
      this.name,
      this.conversionRate,
      this.phone,
      this.threshold,
      this.summary,
      this.cost,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a activation variance in status draft. */
export function newActivationVariance(code: string, name: string): ActivationVariance {
  return new ActivationVariance(code, name, 0, "", 0, "", 0, 0, "draft");
}
