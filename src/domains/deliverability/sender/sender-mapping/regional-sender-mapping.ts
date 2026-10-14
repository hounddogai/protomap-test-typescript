/**
 * The regional sender mapping records of deliverability's sender work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional sender mapping is in its life cycle. */
export type RegionalSenderMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional sender mapping as the sender team keeps it. */
export class RegionalSenderMapping {
  code: string;
  label: string;
  variant: string;
  weight: number;
  maximum: number;
  status: RegionalSenderMappingStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    weight: number,
    maximum: number,
    status: RegionalSenderMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.weight = weight;
    this.maximum = maximum;
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

  canMoveTo(next: RegionalSenderMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSenderMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sender mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional sender mapping"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.weight - this.maximum) * 100) / 100;
  }

  copy(): RegionalSenderMapping {
    return new RegionalSenderMapping(this.code, this.label, this.variant, this.weight, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional sender mapping in status planned. */
export function newRegionalSenderMapping(code: string, label: string): RegionalSenderMapping {
  return new RegionalSenderMapping(code, label, "", 0, 0, "planned");
}
