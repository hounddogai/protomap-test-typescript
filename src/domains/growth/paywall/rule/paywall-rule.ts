/**
 * The paywall rule records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall rule is in its life cycle. */
export type PaywallRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A paywall rule. Its code is unique within a tenant. */
export class PaywallRule {
  code: string;
  title: string;
  floorValue: number;
  endsAt: number;
  quantity: number;
  conversionRate: number;
  timezone: string;
  pinned: boolean;
  source: string;
  durationMinutes: number;
  category: string;
  status: PaywallRuleStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    endsAt: number,
    quantity: number,
    conversionRate: number,
    timezone: string,
    pinned: boolean,
    source: string,
    durationMinutes: number,
    category: string,
    status: PaywallRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.endsAt = endsAt;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.timezone = timezone;
    this.pinned = pinned;
    this.source = source;
    this.durationMinutes = durationMinutes;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallRuleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PaywallRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedValue(): number {
    return Math.round(this.quantity * this.floorValue * 100) / 100;
  }

  copy(): PaywallRule {
    return new PaywallRule(
      this.code,
      this.title,
      this.floorValue,
      this.endsAt,
      this.quantity,
      this.conversionRate,
      this.timezone,
      this.pinned,
      this.source,
      this.durationMinutes,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a paywall rule in status new. */
export function newPaywallRule(code: string, title: string): PaywallRule {
  return new PaywallRule(code, title, 0, 0, 0, 0, "", false, "", 0, "", "new");
}
