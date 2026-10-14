/**
 * The approval policy records of social's approval work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval policy is in its life cycle. */
export type ApprovalPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a approval policy and its current status. */
export class ApprovalPolicy {
  code: string;
  name: string;
  cohort: string;
  country: string;
  limit: number;
  reviewer: string;
  source: string;
  attributes: Map<string, string>;
  expiresAt: number;
  status: ApprovalPolicyStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    country: string,
    limit: number,
    reviewer: string,
    source: string,
    attributes: Map<string, string>,
    expiresAt: number,
    status: ApprovalPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.country = country;
    this.limit = limit;
    this.reviewer = reviewer;
    this.source = source;
    this.attributes = attributes;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: ApprovalPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round(this.limit * this.expiresAt * 100) / 100;
  }

  copy(): ApprovalPolicy {
    return new ApprovalPolicy(
      this.code,
      this.name,
      this.cohort,
      this.country,
      this.limit,
      this.reviewer,
      this.source,
      this.attributes,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a approval policy in status proposed. */
export function newApprovalPolicy(code: string, name: string): ApprovalPolicy {
  return new ApprovalPolicy(code, name, "", "", 0, "", "", new Map<string, string>(), 0, "proposed");
}
