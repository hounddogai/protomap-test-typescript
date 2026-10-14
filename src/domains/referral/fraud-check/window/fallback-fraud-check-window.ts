/**
 * The fallback fraud check window records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback fraud check window is in its life cycle. */
export type FallbackFraudCheckWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback fraud check window. Its code is unique within a tenant. */
export class FallbackFraudCheckWindow {
  code: string;
  name: string;
  attributes: Map<string, string>;
  ratio: number;
  attempts: number;
  currency: string;
  updatedAt: number;
  clicks: number;
  expiresAt: number;
  revision: number;
  status: FallbackFraudCheckWindowStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    ratio: number,
    attempts: number,
    currency: string,
    updatedAt: number,
    clicks: number,
    expiresAt: number,
    revision: number,
    status: FallbackFraudCheckWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.ratio = ratio;
    this.attempts = attempts;
    this.currency = currency;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.revision = revision;
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

  canMoveTo(next: FallbackFraudCheckWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
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
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackFraudCheckWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback fraud check window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"fallback fraud check window"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.expiresAt + this.attempts) * 100) / 100;
  }

  copy(): FallbackFraudCheckWindow {
    return new FallbackFraudCheckWindow(
      this.code,
      this.name,
      this.attributes,
      this.ratio,
      this.attempts,
      this.currency,
      this.updatedAt,
      this.clicks,
      this.expiresAt,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback fraud check window in status idle. */
export function newFallbackFraudCheckWindow(code: string, name: string): FallbackFraudCheckWindow {
  return new FallbackFraudCheckWindow(code, name, new Map<string, string>(), 0, 0, "", 0, 0, 0, 0, "idle");
}
