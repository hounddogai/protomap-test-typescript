/**
 * The tiered sender digest records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered sender digest is in its life cycle. */
export type TieredSenderDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered sender digest, with what the planners need to act on it. */
export class TieredSenderDigest {
  code: string;
  title: string;
  locale: string;
  capacity: number;
  externalRef: string;
  minimum: number;
  cohort: string;
  maximum: number;
  attempts: number;
  status: TieredSenderDigestStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    capacity: number,
    externalRef: string,
    minimum: number,
    cohort: string,
    maximum: number,
    attempts: number,
    status: TieredSenderDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.capacity = capacity;
    this.externalRef = externalRef;
    this.minimum = minimum;
    this.cohort = cohort;
    this.maximum = maximum;
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

  canMoveTo(next: TieredSenderDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: TieredSenderDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered sender digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round(this.maximum * this.attempts * 100) / 100;
  }

  copy(): TieredSenderDigest {
    return new TieredSenderDigest(
      this.code,
      this.title,
      this.locale,
      this.capacity,
      this.externalRef,
      this.minimum,
      this.cohort,
      this.maximum,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered sender digest in status idle. */
export function newTieredSenderDigest(code: string, title: string): TieredSenderDigest {
  return new TieredSenderDigest(code, title, "", 0, "", 0, "", 0, 0, "idle");
}
