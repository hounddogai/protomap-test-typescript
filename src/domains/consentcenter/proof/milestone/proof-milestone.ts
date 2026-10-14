/**
 * The proof milestone records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof milestone is in its life cycle. */
export type ProofMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A proof milestone as the proof team keeps it. */
export class ProofMilestone {
  code: string;
  name: string;
  discount: number;
  conversionRate: number;
  country: string;
  timezone: string;
  budget: number;
  category: string;
  status: ProofMilestoneStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    conversionRate: number,
    country: string,
    timezone: string,
    budget: number,
    category: string,
    status: ProofMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.conversionRate = conversionRate;
    this.country = country;
    this.timezone = timezone;
    this.budget = budget;
    this.category = category;
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

  canMoveTo(next: ProofMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: ProofMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.budget - this.conversionRate) * 100) / 100;
  }

  copy(): ProofMilestone {
    return new ProofMilestone(
      this.code,
      this.name,
      this.discount,
      this.conversionRate,
      this.country,
      this.timezone,
      this.budget,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a proof milestone in status draft. */
export function newProofMilestone(code: string, name: string): ProofMilestone {
  return new ProofMilestone(code, name, 0, 0, "", "", 0, "", "draft");
}
