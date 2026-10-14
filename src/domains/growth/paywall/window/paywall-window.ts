/**
 * The paywall window records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall window is in its life cycle. */
export type PaywallWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a paywall window and its current status. */
export class PaywallWindow {
  code: string;
  label: string;
  updatedAt: number;
  limit: number;
  region: string;
  status: PaywallWindowStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    limit: number,
    region: string,
    status: PaywallWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.limit = limit;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.limit + this.updatedAt) * 100) / 100;
  }

  copy(): PaywallWindow {
    return new PaywallWindow(this.code, this.label, this.updatedAt, this.limit, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a paywall window in status planned. */
export function newPaywallWindow(code: string, label: string): PaywallWindow {
  return new PaywallWindow(code, label, 0, 0, "", "planned");
}
