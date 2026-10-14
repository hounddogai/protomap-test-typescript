/**
 * The adaptive paywall threshold records of growth's paywall work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive paywall threshold is in its life cycle. */
export type AdaptivePaywallThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive paywall threshold and its current status. */
export class AdaptivePaywallThreshold {
  code: string;
  name: string;
  contactEmail: string;
  tags: string[];
  priority: number;
  variant: string;
  sequence: number;
  status: AdaptivePaywallThresholdStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    tags: string[],
    priority: number,
    variant: string,
    sequence: number,
    status: AdaptivePaywallThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.tags = tags;
    this.priority = priority;
    this.variant = variant;
    this.sequence = sequence;
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

  canMoveTo(next: AdaptivePaywallThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePaywallThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive paywall threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round(this.sequence * this.priority * 100) / 100;
  }

  copy(): AdaptivePaywallThreshold {
    return new AdaptivePaywallThreshold(
      this.code,
      this.name,
      this.contactEmail,
      this.tags,
      this.priority,
      this.variant,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive paywall threshold in status draft. */
export function newAdaptivePaywallThreshold(code: string, name: string): AdaptivePaywallThreshold {
  return new AdaptivePaywallThreshold(code, name, "", [], 0, "", 0, "draft");
}
