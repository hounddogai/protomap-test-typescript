/**
 * The adaptive subscription checkpoint records of consentcenter's subscription work, and the rules, stores,
 * and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive subscription checkpoint is in its life cycle. */
export type AdaptiveSubscriptionCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One adaptive subscription checkpoint, with what the planners need to act on it. */
export class AdaptiveSubscriptionCheckpoint {
  code: string;
  title: string;
  expiresAt: number;
  retries: number;
  unit: string;
  budget: number;
  version: number;
  attempts: number;
  status: AdaptiveSubscriptionCheckpointStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    retries: number,
    unit: string,
    budget: number,
    version: number,
    attempts: number,
    status: AdaptiveSubscriptionCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.retries = retries;
    this.unit = unit;
    this.budget = budget;
    this.version = version;
    this.attempts = attempts;
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

  canMoveTo(next: AdaptiveSubscriptionCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: AdaptiveSubscriptionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive subscription checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.version - this.retries) * 100) / 100;
  }

  copy(): AdaptiveSubscriptionCheckpoint {
    return new AdaptiveSubscriptionCheckpoint(
      this.code,
      this.title,
      this.expiresAt,
      this.retries,
      this.unit,
      this.budget,
      this.version,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive subscription checkpoint in status idle. */
export function newAdaptiveSubscriptionCheckpoint(code: string, title: string): AdaptiveSubscriptionCheckpoint {
  return new AdaptiveSubscriptionCheckpoint(code, title, 0, 0, "", 0, 0, 0, "idle");
}
