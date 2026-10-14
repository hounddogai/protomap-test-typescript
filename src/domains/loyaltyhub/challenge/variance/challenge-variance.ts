/**
 * The challenge variance records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge variance is in its life cycle. */
export type ChallengeVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A challenge variance. Its code is unique within a tenant. */
export class ChallengeVariance {
  code: string;
  title: string;
  windowDays: number;
  minimum: number;
  quantity: number;
  active: boolean;
  retries: number;
  contactEmail: string;
  openRate: number;
  status: ChallengeVarianceStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    minimum: number,
    quantity: number,
    active: boolean,
    retries: number,
    contactEmail: string,
    openRate: number,
    status: ChallengeVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.minimum = minimum;
    this.quantity = quantity;
    this.active = active;
    this.retries = retries;
    this.contactEmail = contactEmail;
    this.openRate = openRate;
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

  canMoveTo(next: ChallengeVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ChallengeVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.openRate + this.quantity) * 100) / 100;
  }

  copy(): ChallengeVariance {
    return new ChallengeVariance(
      this.code,
      this.title,
      this.windowDays,
      this.minimum,
      this.quantity,
      this.active,
      this.retries,
      this.contactEmail,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a challenge variance in status idle. */
export function newChallengeVariance(code: string, title: string): ChallengeVariance {
  return new ChallengeVariance(code, title, 0, 0, 0, false, 0, "", 0, "idle");
}
