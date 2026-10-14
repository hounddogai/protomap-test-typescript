/**
 * The lenient bid rule manifest records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient bid rule manifest is in its life cycle. */
export type LenientBidRuleManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient bid rule manifest. Its code is unique within a tenant. */
export class LenientBidRuleManifest {
  code: string;
  name: string;
  openRate: number;
  locale: string;
  summary: string;
  currency: string;
  quantity: number;
  category: string;
  status: LenientBidRuleManifestStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    locale: string,
    summary: string,
    currency: string,
    quantity: number,
    category: string,
    status: LenientBidRuleManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.locale = locale;
    this.summary = summary;
    this.currency = currency;
    this.quantity = quantity;
    this.category = category;
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

  canMoveTo(next: LenientBidRuleManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientBidRuleManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient bid rule manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round((this.quantity - this.openRate) * 100) / 100;
  }

  copy(): LenientBidRuleManifest {
    return new LenientBidRuleManifest(
      this.code,
      this.name,
      this.openRate,
      this.locale,
      this.summary,
      this.currency,
      this.quantity,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient bid rule manifest in status draft. */
export function newLenientBidRuleManifest(code: string, name: string): LenientBidRuleManifest {
  return new LenientBidRuleManifest(code, name, 0, "", "", "", 0, "", "draft");
}
