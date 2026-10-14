/**
 * The strict escalation adjustment records of support's escalation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict escalation adjustment is in its life cycle. */
export type StrictEscalationAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict escalation adjustment, with what the planners need to act on it. */
export class StrictEscalationAdjustment {
  code: string;
  name: string;
  discount: number;
  rate: number;
  region: string;
  campaignRef: string;
  status: StrictEscalationAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    rate: number,
    region: string,
    campaignRef: string,
    status: StrictEscalationAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.rate = rate;
    this.region = region;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictEscalationAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictEscalationAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict escalation adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict escalation adjustment"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.discount - this.rate) * 100) / 100;
  }

  copy(): StrictEscalationAdjustment {
    return new StrictEscalationAdjustment(
      this.code,
      this.name,
      this.discount,
      this.rate,
      this.region,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict escalation adjustment in status open. */
export function newStrictEscalationAdjustment(code: string, name: string): StrictEscalationAdjustment {
  return new StrictEscalationAdjustment(code, name, 0, 0, "", "", "open");
}
