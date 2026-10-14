/**
 * The subscription audit records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription audit is in its life cycle. */
export type SubscriptionAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A subscription audit as the subscription team keeps it. */
export class SubscriptionAudit {
  code: string;
  label: string;
  channel: string;
  utmSource: string;
  cost: number;
  windowDays: number;
  journeyId: string;
  currency: string;
  unit: string;
  expiresAt: number;
  status: SubscriptionAuditStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    utmSource: string,
    cost: number,
    windowDays: number,
    journeyId: string,
    currency: string,
    unit: string,
    expiresAt: number,
    status: SubscriptionAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.utmSource = utmSource;
    this.cost = cost;
    this.windowDays = windowDays;
    this.journeyId = journeyId;
    this.currency = currency;
    this.unit = unit;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: SubscriptionAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SubscriptionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedExposure(): number {
    return Math.round((this.expiresAt - this.windowDays) * 100) / 100;
  }

  copy(): SubscriptionAudit {
    return new SubscriptionAudit(
      this.code,
      this.label,
      this.channel,
      this.utmSource,
      this.cost,
      this.windowDays,
      this.journeyId,
      this.currency,
      this.unit,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a subscription audit in status draft. */
export function newSubscriptionAudit(code: string, label: string): SubscriptionAudit {
  return new SubscriptionAudit(code, label, "", "", 0, 0, "", "", "", 0, "draft");
}
