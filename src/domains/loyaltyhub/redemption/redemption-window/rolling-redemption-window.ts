/**
 * The rolling redemption window records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling redemption window is in its life cycle. */
export type RollingRedemptionWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One rolling redemption window, with what the planners need to act on it. */
export class RollingRedemptionWindow {
  code: string;
  label: string;
  region: string;
  attributes: Map<string, string>;
  endsAt: number;
  phone: string;
  active: boolean;
  source: string;
  status: RollingRedemptionWindowStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    attributes: Map<string, string>,
    endsAt: number,
    phone: string,
    active: boolean,
    source: string,
    status: RollingRedemptionWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.attributes = attributes;
    this.endsAt = endsAt;
    this.phone = phone;
    this.active = active;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingRedemptionWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingRedemptionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling redemption window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): RollingRedemptionWindow {
    return new RollingRedemptionWindow(
      this.code,
      this.label,
      this.region,
      this.attributes,
      this.endsAt,
      this.phone,
      this.active,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling redemption window in status draft. */
export function newRollingRedemptionWindow(code: string, label: string): RollingRedemptionWindow {
  return new RollingRedemptionWindow(code, label, "", new Map<string, string>(), 0, "", false, "", "draft");
}
