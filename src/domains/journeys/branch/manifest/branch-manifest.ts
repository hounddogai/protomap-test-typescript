/**
 * The branch manifest records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch manifest is in its life cycle. */
export type BranchManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A branch manifest. Its code is unique within a tenant. */
export class BranchManifest {
  code: string;
  label: string;
  attributes: Map<string, string>;
  locale: string;
  amount: number;
  discount: number;
  category: string;
  timezone: string;
  approved: boolean;
  status: BranchManifestStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    locale: string,
    amount: number,
    discount: number,
    category: string,
    timezone: string,
    approved: boolean,
    status: BranchManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.locale = locale;
    this.amount = amount;
    this.discount = discount;
    this.category = category;
    this.timezone = timezone;
    this.approved = approved;
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

  canMoveTo(next: BranchManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BranchManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"branch manifest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.discount - this.amount) * 100) / 100;
  }

  copy(): BranchManifest {
    return new BranchManifest(
      this.code,
      this.label,
      this.attributes,
      this.locale,
      this.amount,
      this.discount,
      this.category,
      this.timezone,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a branch manifest in status idle. */
export function newBranchManifest(code: string, label: string): BranchManifest {
  return new BranchManifest(code, label, new Map<string, string>(), "", 0, 0, "", "", false, "idle");
}
