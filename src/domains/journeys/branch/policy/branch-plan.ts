import * as text from "../../../../kit/text.js";

/** Where a branch plan is in its life cycle. */
export type BranchPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a branch plan and its current status. */
export class BranchPlan {
  code: string;
  label: string;
  title: string;
  discount: number;
  variant: string;
  reviewer: string;
  attributes: Map<string, string>;
  externalRef: string;
  cost: number;
  status: BranchPlanStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    discount: number,
    variant: string,
    reviewer: string,
    attributes: Map<string, string>,
    externalRef: string,
    cost: number,
    status: BranchPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.discount = discount;
    this.variant = variant;
    this.reviewer = reviewer;
    this.attributes = attributes;
    this.externalRef = externalRef;
    this.cost = cost;
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

  canMoveTo(next: BranchPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BranchPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round((this.discount + this.cost) * 100) / 100;
  }

  copy(): BranchPlan {
    return new BranchPlan(
      this.code,
      this.label,
      this.title,
      this.discount,
      this.variant,
      this.reviewer,
      this.attributes,
      this.externalRef,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a branch plan in status open. */
export function newBranchPlan(code: string, label: string): BranchPlan {
  return new BranchPlan(code, label, "", 0, "", "", new Map<string, string>(), "", 0, "open");
}
