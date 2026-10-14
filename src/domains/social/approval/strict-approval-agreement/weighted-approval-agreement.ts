/**
 * The weighted approval agreement records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted approval agreement is in its life cycle. */
export type WeightedApprovalAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted approval agreement, with what the planners need to act on it. */
export class WeightedApprovalAgreement {
  code: string;
  title: string;
  category: string;
  region: string;
  margin: number;
  weight: number;
  status: WeightedApprovalAgreementStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    region: string,
    margin: number,
    weight: number,
    status: WeightedApprovalAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.region = region;
    this.margin = margin;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedApprovalAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedApprovalAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted approval agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted approval agreement"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.margin + this.weight) * 100) / 100;
  }

  copy(): WeightedApprovalAgreement {
    return new WeightedApprovalAgreement(
      this.code,
      this.title,
      this.category,
      this.region,
      this.margin,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted approval agreement in status new. */
export function newWeightedApprovalAgreement(code: string, title: string): WeightedApprovalAgreement {
  return new WeightedApprovalAgreement(code, title, "", "", 0, 0, "new");
}
