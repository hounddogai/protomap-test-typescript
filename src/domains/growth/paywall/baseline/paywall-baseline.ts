/**
 * The paywall baseline records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall baseline is in its life cycle. */
export type PaywallBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a paywall baseline and its current status. */
export class PaywallBaseline {
  code: string;
  label: string;
  ceiling: number;
  archived: boolean;
  quantity: number;
  minimum: number;
  status: PaywallBaselineStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    archived: boolean,
    quantity: number,
    minimum: number,
    status: PaywallBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.archived = archived;
    this.quantity = quantity;
    this.minimum = minimum;
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

  canMoveTo(next: PaywallBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.minimum + this.ceiling) * 100) / 100;
  }

  copy(): PaywallBaseline {
    return new PaywallBaseline(
      this.code,
      this.label,
      this.ceiling,
      this.archived,
      this.quantity,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a paywall baseline in status requested. */
export function newPaywallBaseline(code: string, label: string): PaywallBaseline {
  return new PaywallBaseline(code, label, 0, false, 0, 0, "requested");
}
