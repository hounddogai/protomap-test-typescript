/**
 * The fallback fraud check policy records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback fraud check policy is in its life cycle. */
export type FallbackFraudCheckPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a fallback fraud check policy and its current status. */
export class FallbackFraudCheckPolicy {
  code: string;
  name: string;
  label: string;
  priority: number;
  limit: number;
  source: string;
  impressions: number;
  status: FallbackFraudCheckPolicyStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    priority: number,
    limit: number,
    source: string,
    impressions: number,
    status: FallbackFraudCheckPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.priority = priority;
    this.limit = limit;
    this.source = source;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackFraudCheckPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackFraudCheckPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback fraud check policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback fraud check policy"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.impressions * this.limit * 100) / 100;
  }

  copy(): FallbackFraudCheckPolicy {
    return new FallbackFraudCheckPolicy(
      this.code,
      this.name,
      this.label,
      this.priority,
      this.limit,
      this.source,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fallback fraud check policy in status planned. */
export function newFallbackFraudCheckPolicy(code: string, name: string): FallbackFraudCheckPolicy {
  return new FallbackFraudCheckPolicy(code, name, "", 0, 0, "", 0, "planned");
}
