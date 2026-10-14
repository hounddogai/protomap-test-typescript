/**
 * The regional paywall window records of growth's paywall work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional paywall window is in its life cycle. */
export type RegionalPaywallWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One regional paywall window, with what the planners need to act on it. */
export class RegionalPaywallWindow {
  code: string;
  title: string;
  archived: boolean;
  conversionRate: number;
  quantity: number;
  region: string;
  expiresAt: number;
  startsAt: number;
  attributes: Map<string, string>;
  source: string;
  status: RegionalPaywallWindowStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    conversionRate: number,
    quantity: number,
    region: string,
    expiresAt: number,
    startsAt: number,
    attributes: Map<string, string>,
    source: string,
    status: RegionalPaywallWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.conversionRate = conversionRate;
    this.quantity = quantity;
    this.region = region;
    this.expiresAt = expiresAt;
    this.startsAt = startsAt;
    this.attributes = attributes;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPaywallWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalPaywallWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional paywall window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedLoad(): number {
    return Math.round(this.conversionRate * this.expiresAt * 100) / 100;
  }

  copy(): RegionalPaywallWindow {
    return new RegionalPaywallWindow(
      this.code,
      this.title,
      this.archived,
      this.conversionRate,
      this.quantity,
      this.region,
      this.expiresAt,
      this.startsAt,
      this.attributes,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional paywall window in status proposed. */
export function newRegionalPaywallWindow(code: string, title: string): RegionalPaywallWindow {
  return new RegionalPaywallWindow(code, title, false, 0, 0, "", 0, 0, new Map<string, string>(), "", "proposed");
}
