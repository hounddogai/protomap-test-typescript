/**
 * The proof policy records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof policy is in its life cycle. */
export type ProofPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a proof policy and its current status. */
export class ProofPolicy {
  code: string;
  label: string;
  capacity: number;
  cohort: string;
  margin: number;
  contactEmail: string;
  amount: number;
  title: string;
  clicks: number;
  status: ProofPolicyStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    cohort: string,
    margin: number,
    contactEmail: string,
    amount: number,
    title: string,
    clicks: number,
    status: ProofPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.cohort = cohort;
    this.margin = margin;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.title = title;
    this.clicks = clicks;
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

  canMoveTo(next: ProofPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ProofPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"proof policy"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.margin + this.capacity) * 100) / 100;
  }

  copy(): ProofPolicy {
    return new ProofPolicy(
      this.code,
      this.label,
      this.capacity,
      this.cohort,
      this.margin,
      this.contactEmail,
      this.amount,
      this.title,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a proof policy in status open. */
export function newProofPolicy(code: string, label: string): ProofPolicy {
  return new ProofPolicy(code, label, 0, "", 0, "", 0, "", 0, "open");
}
