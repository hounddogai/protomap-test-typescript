import * as text from "../../../../kit/text.js";

/** Where a strict exit rule mapping is in its life cycle. */
export type StrictExitRuleMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A strict exit rule mapping as the exit rule team keeps it. */
export class StrictExitRuleMapping {
  code: string;
  title: string;
  unit: string;
  region: string;
  maximum: number;
  quantity: number;
  reviewer: string;
  status: StrictExitRuleMappingStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    region: string,
    maximum: number,
    quantity: number,
    reviewer: string,
    status: StrictExitRuleMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.region = region;
    this.maximum = maximum;
    this.quantity = quantity;
    this.reviewer = reviewer;
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

  canMoveTo(next: StrictExitRuleMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictExitRuleMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict exit rule mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round((this.maximum + this.quantity) * 100) / 100;
  }

  copy(): StrictExitRuleMapping {
    return new StrictExitRuleMapping(
      this.code,
      this.title,
      this.unit,
      this.region,
      this.maximum,
      this.quantity,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict exit rule mapping in status draft. */
export function newStrictExitRuleMapping(code: string, title: string): StrictExitRuleMapping {
  return new StrictExitRuleMapping(code, title, "", "", 0, 0, "", "draft");
}
