/**
 * The rolling paywall window records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling paywall window is in its life cycle. */
export type RollingPaywallWindowStatus = "created" | "validated" | "published" | "retired";

/** One rolling paywall window, with what the planners need to act on it. */
export class RollingPaywallWindow {
  code: string;
  label: string;
  retries: number;
  expiresAt: number;
  externalRef: string;
  sendAt: number;
  status: RollingPaywallWindowStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    expiresAt: number,
    externalRef: string,
    sendAt: number,
    status: RollingPaywallWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.expiresAt = expiresAt;
    this.externalRef = externalRef;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingPaywallWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingPaywallWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling paywall window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"rolling paywall window"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.expiresAt + this.retries) * 100) / 100;
  }

  copy(): RollingPaywallWindow {
    return new RollingPaywallWindow(
      this.code,
      this.label,
      this.retries,
      this.expiresAt,
      this.externalRef,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling paywall window in status created. */
export function newRollingPaywallWindow(code: string, label: string): RollingPaywallWindow {
  return new RollingPaywallWindow(code, label, 0, 0, "", 0, "created");
}
