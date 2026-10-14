/**
 * The primary reputation claim records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary reputation claim is in its life cycle. */
export type PrimaryReputationClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary reputation claim. Its code is unique within a tenant. */
export class PrimaryReputationClaim {
  code: string;
  title: string;
  startsAt: number;
  tags: string[];
  phone: string;
  budget: number;
  reviewer: string;
  updatedAt: number;
  margin: number;
  variant: string;
  windowDays: number;
  status: PrimaryReputationClaimStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    tags: string[],
    phone: string,
    budget: number,
    reviewer: string,
    updatedAt: number,
    margin: number,
    variant: string,
    windowDays: number,
    status: PrimaryReputationClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.tags = tags;
    this.phone = phone;
    this.budget = budget;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.margin = margin;
    this.variant = variant;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryReputationClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryReputationClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary reputation claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary reputation claim"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.windowDays + this.startsAt) * 100) / 100;
  }

  copy(): PrimaryReputationClaim {
    return new PrimaryReputationClaim(
      this.code,
      this.title,
      this.startsAt,
      this.tags,
      this.phone,
      this.budget,
      this.reviewer,
      this.updatedAt,
      this.margin,
      this.variant,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary reputation claim in status proposed. */
export function newPrimaryReputationClaim(code: string, title: string): PrimaryReputationClaim {
  return new PrimaryReputationClaim(code, title, 0, [], "", 0, "", 0, 0, "", 0, "proposed");
}
