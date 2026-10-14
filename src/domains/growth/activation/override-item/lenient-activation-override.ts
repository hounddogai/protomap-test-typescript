/**
 * The lenient activation override records of growth's activation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient activation override is in its life cycle. */
export type LenientActivationOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient activation override as the activation team keeps it. */
export class LenientActivationOverride {
  code: string;
  name: string;
  variant: string;
  ceiling: number;
  sendAt: number;
  status: LenientActivationOverrideStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    ceiling: number,
    sendAt: number,
    status: LenientActivationOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.ceiling = ceiling;
    this.sendAt = sendAt;
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

  canMoveTo(next: LenientActivationOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
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

  moveTo(next: LenientActivationOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient activation override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.sendAt - this.ceiling) * 100) / 100;
  }

  copy(): LenientActivationOverride {
    return new LenientActivationOverride(this.code, this.name, this.variant, this.ceiling, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient activation override in status idle. */
export function newLenientActivationOverride(code: string, name: string): LenientActivationOverride {
  return new LenientActivationOverride(code, name, "", 0, 0, "idle");
}
