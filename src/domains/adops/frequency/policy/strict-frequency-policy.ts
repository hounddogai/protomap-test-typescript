/**
 * The strict frequency policy records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict frequency policy is in its life cycle. */
export type StrictFrequencyPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict frequency policy as the frequency team keeps it. */
export class StrictFrequencyPolicy {
  code: string;
  label: string;
  windowDays: number;
  bid: number;
  attributes: Map<string, string>;
  budget: number;
  ownerId: string;
  status: StrictFrequencyPolicyStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    bid: number,
    attributes: Map<string, string>,
    budget: number,
    ownerId: string,
    status: StrictFrequencyPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.bid = bid;
    this.attributes = attributes;
    this.budget = budget;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictFrequencyPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictFrequencyPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict frequency policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  netVolume(): number {
    return Math.round((this.bid - this.budget) * 100) / 100;
  }

  copy(): StrictFrequencyPolicy {
    return new StrictFrequencyPolicy(
      this.code,
      this.label,
      this.windowDays,
      this.bid,
      this.attributes,
      this.budget,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict frequency policy in status idle. */
export function newStrictFrequencyPolicy(code: string, label: string): StrictFrequencyPolicy {
  return new StrictFrequencyPolicy(code, label, 0, 0, new Map<string, string>(), 0, "", "idle");
}
