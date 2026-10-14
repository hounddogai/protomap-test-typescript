/**
 * The double opt in policy records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in policy is in its life cycle. */
export type DoubleOptInPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One double opt in policy, with what the planners need to act on it. */
export class DoubleOptInPolicy {
  code: string;
  label: string;
  minimum: number;
  frequencyCap: number;
  clicks: number;
  cohort: string;
  sendAt: number;
  ratio: number;
  capacity: number;
  country: string;
  status: DoubleOptInPolicyStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    frequencyCap: number,
    clicks: number,
    cohort: string,
    sendAt: number,
    ratio: number,
    capacity: number,
    country: string,
    status: DoubleOptInPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.frequencyCap = frequencyCap;
    this.clicks = clicks;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.ratio = ratio;
    this.capacity = capacity;
    this.country = country;
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

  canMoveTo(next: DoubleOptInPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DoubleOptInPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.ratio * this.capacity * 100) / 100;
  }

  copy(): DoubleOptInPolicy {
    return new DoubleOptInPolicy(
      this.code,
      this.label,
      this.minimum,
      this.frequencyCap,
      this.clicks,
      this.cohort,
      this.sendAt,
      this.ratio,
      this.capacity,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a double opt in policy in status idle. */
export function newDoubleOptInPolicy(code: string, label: string): DoubleOptInPolicy {
  return new DoubleOptInPolicy(code, label, 0, 0, 0, "", 0, 0, 0, "", "idle");
}
