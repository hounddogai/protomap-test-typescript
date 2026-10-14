/**
 * The fraud check profile records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check profile is in its life cycle. */
export type FraudCheckProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fraud check profile and its current status. */
export class FraudCheckProfile {
  code: string;
  name: string;
  graceDays: number;
  openRate: number;
  externalRef: string;
  description: string;
  status: FraudCheckProfileStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    openRate: number,
    externalRef: string,
    description: string,
    status: FraudCheckProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.openRate = openRate;
    this.externalRef = externalRef;
    this.description = description;
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

  canMoveTo(next: FraudCheckProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.openRate - this.graceDays) * 100) / 100;
  }

  copy(): FraudCheckProfile {
    return new FraudCheckProfile(
      this.code,
      this.name,
      this.graceDays,
      this.openRate,
      this.externalRef,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fraud check profile in status idle. */
export function newFraudCheckProfile(code: string, name: string): FraudCheckProfile {
  return new FraudCheckProfile(code, name, 0, 0, "", "", "idle");
}
