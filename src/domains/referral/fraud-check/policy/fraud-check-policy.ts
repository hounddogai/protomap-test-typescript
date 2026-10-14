/**
 * The fraud check policy records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check policy is in its life cycle. */
export type FraudCheckPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a fraud check policy and its current status. */
export class FraudCheckPolicy {
  code: string;
  title: string;
  attributes: Map<string, string>;
  updatedAt: number;
  reviewer: string;
  segment: string;
  source: string;
  variant: string;
  approved: boolean;
  status: FraudCheckPolicyStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    updatedAt: number,
    reviewer: string,
    segment: string,
    source: string,
    variant: string,
    approved: boolean,
    status: FraudCheckPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.updatedAt = updatedAt;
    this.reviewer = reviewer;
    this.segment = segment;
    this.source = source;
    this.variant = variant;
    this.approved = approved;
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

  canMoveTo(next: FraudCheckPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): FraudCheckPolicy {
    return new FraudCheckPolicy(
      this.code,
      this.title,
      this.attributes,
      this.updatedAt,
      this.reviewer,
      this.segment,
      this.source,
      this.variant,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fraud check policy in status requested. */
export function newFraudCheckPolicy(code: string, title: string): FraudCheckPolicy {
  return new FraudCheckPolicy(code, title, new Map<string, string>(), 0, "", "", "", "", false, "requested");
}
