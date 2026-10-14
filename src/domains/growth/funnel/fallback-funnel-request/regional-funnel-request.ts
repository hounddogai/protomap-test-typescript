/**
 * The regional funnel request records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional funnel request is in its life cycle. */
export type RegionalFunnelRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional funnel request as the funnel team keeps it. */
export class RegionalFunnelRequest {
  code: string;
  title: string;
  discount: number;
  sendAt: number;
  openRate: number;
  budget: number;
  label: string;
  windowDays: number;
  clicks: number;
  rate: number;
  priority: number;
  status: RegionalFunnelRequestStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    sendAt: number,
    openRate: number,
    budget: number,
    label: string,
    windowDays: number,
    clicks: number,
    rate: number,
    priority: number,
    status: RegionalFunnelRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.sendAt = sendAt;
    this.openRate = openRate;
    this.budget = budget;
    this.label = label;
    this.windowDays = windowDays;
    this.clicks = clicks;
    this.rate = rate;
    this.priority = priority;
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

  canMoveTo(next: RegionalFunnelRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalFunnelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional funnel request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional funnel request"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.rate - this.clicks) * 100) / 100;
  }

  copy(): RegionalFunnelRequest {
    return new RegionalFunnelRequest(
      this.code,
      this.title,
      this.discount,
      this.sendAt,
      this.openRate,
      this.budget,
      this.label,
      this.windowDays,
      this.clicks,
      this.rate,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional funnel request in status proposed. */
export function newRegionalFunnelRequest(code: string, title: string): RegionalFunnelRequest {
  return new RegionalFunnelRequest(code, title, 0, 0, 0, 0, "", 0, 0, 0, 0, "proposed");
}
