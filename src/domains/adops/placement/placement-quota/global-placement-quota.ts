/**
 * The global placement quota records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global placement quota is in its life cycle. */
export type GlobalPlacementQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global placement quota as the placement team keeps it. */
export class GlobalPlacementQuota {
  code: string;
  name: string;
  priority: number;
  budget: number;
  graceDays: number;
  externalRef: string;
  channel: string;
  campaignRef: string;
  status: GlobalPlacementQuotaStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    budget: number,
    graceDays: number,
    externalRef: string,
    channel: string,
    campaignRef: string,
    status: GlobalPlacementQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.budget = budget;
    this.graceDays = graceDays;
    this.externalRef = externalRef;
    this.channel = channel;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: GlobalPlacementQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
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

  moveTo(next: GlobalPlacementQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global placement quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round(this.budget * this.priority * 100) / 100;
  }

  copy(): GlobalPlacementQuota {
    return new GlobalPlacementQuota(
      this.code,
      this.name,
      this.priority,
      this.budget,
      this.graceDays,
      this.externalRef,
      this.channel,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global placement quota in status proposed. */
export function newGlobalPlacementQuota(code: string, name: string): GlobalPlacementQuota {
  return new GlobalPlacementQuota(code, name, 0, 0, 0, "", "", "", "proposed");
}
