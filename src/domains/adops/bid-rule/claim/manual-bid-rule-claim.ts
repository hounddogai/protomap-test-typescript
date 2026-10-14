/**
 * The manual bid rule claim records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual bid rule claim is in its life cycle. */
export type ManualBidRuleClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual bid rule claim. Its code is unique within a tenant. */
export class ManualBidRuleClaim {
  code: string;
  label: string;
  locale: string;
  impressions: number;
  description: string;
  status: ManualBidRuleClaimStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    impressions: number,
    description: string,
    status: ManualBidRuleClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.impressions = impressions;
    this.description = description;
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

  canMoveTo(next: ManualBidRuleClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: ManualBidRuleClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bid rule claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): ManualBidRuleClaim {
    return new ManualBidRuleClaim(this.code, this.label, this.locale, this.impressions, this.description, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual bid rule claim in status idle. */
export function newManualBidRuleClaim(code: string, label: string): ManualBidRuleClaim {
  return new ManualBidRuleClaim(code, label, "", 0, "", "idle");
}
