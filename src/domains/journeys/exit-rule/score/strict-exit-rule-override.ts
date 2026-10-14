import * as text from "../../../../kit/text.js";

/** Where a strict exit rule override is in its life cycle. */
export type StrictExitRuleOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict exit rule override. Its code is unique within a tenant. */
export class StrictExitRuleOverride {
  code: string;
  label: string;
  budget: number;
  checksum: string;
  margin: number;
  cost: number;
  status: StrictExitRuleOverrideStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    checksum: string,
    margin: number,
    cost: number,
    status: StrictExitRuleOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.checksum = checksum;
    this.margin = margin;
    this.cost = cost;
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

  canMoveTo(next: StrictExitRuleOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
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

  moveTo(next: StrictExitRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict exit rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.margin - this.cost) * 100) / 100;
  }

  copy(): StrictExitRuleOverride {
    return new StrictExitRuleOverride(
      this.code,
      this.label,
      this.budget,
      this.checksum,
      this.margin,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict exit rule override in status requested. */
export function newStrictExitRuleOverride(code: string, label: string): StrictExitRuleOverride {
  return new StrictExitRuleOverride(code, label, 0, "", 0, 0, "requested");
}
