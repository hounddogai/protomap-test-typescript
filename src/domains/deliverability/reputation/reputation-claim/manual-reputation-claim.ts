/**
 * The manual reputation claim records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual reputation claim is in its life cycle. */
export type ManualReputationClaimStatus = "created" | "validated" | "published" | "retired";

/** A manual reputation claim as the reputation team keeps it. */
export class ManualReputationClaim {
  code: string;
  label: string;
  attributes: Map<string, string>;
  attempts: number;
  approved: boolean;
  reviewer: string;
  cost: number;
  expiresAt: number;
  checksum: string;
  status: ManualReputationClaimStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    attempts: number,
    approved: boolean,
    reviewer: string,
    cost: number,
    expiresAt: number,
    checksum: string,
    status: ManualReputationClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.attempts = attempts;
    this.approved = approved;
    this.reviewer = reviewer;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualReputationClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualReputationClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reputation claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round(this.expiresAt * this.cost * 100) / 100;
  }

  copy(): ManualReputationClaim {
    return new ManualReputationClaim(
      this.code,
      this.label,
      this.attributes,
      this.attempts,
      this.approved,
      this.reviewer,
      this.cost,
      this.expiresAt,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual reputation claim in status created. */
export function newManualReputationClaim(code: string, label: string): ManualReputationClaim {
  return new ManualReputationClaim(code, label, new Map<string, string>(), 0, false, "", 0, 0, "", "created");
}
