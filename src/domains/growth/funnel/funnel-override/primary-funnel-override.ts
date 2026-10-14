/**
 * The primary funnel override records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary funnel override is in its life cycle. */
export type PrimaryFunnelOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary funnel override and its current status. */
export class PrimaryFunnelOverride {
  code: string;
  label: string;
  margin: number;
  budget: number;
  externalRef: string;
  unit: string;
  status: PrimaryFunnelOverrideStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    budget: number,
    externalRef: string,
    unit: string,
    status: PrimaryFunnelOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.budget = budget;
    this.externalRef = externalRef;
    this.unit = unit;
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

  canMoveTo(next: PrimaryFunnelOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryFunnelOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary funnel override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.budget * this.margin * 100) / 100;
  }

  copy(): PrimaryFunnelOverride {
    return new PrimaryFunnelOverride(
      this.code,
      this.label,
      this.margin,
      this.budget,
      this.externalRef,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary funnel override in status requested. */
export function newPrimaryFunnelOverride(code: string, label: string): PrimaryFunnelOverride {
  return new PrimaryFunnelOverride(code, label, 0, 0, "", "", "requested");
}
