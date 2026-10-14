/**
 * The tiered bounce plan records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered bounce plan is in its life cycle. */
export type TieredBouncePlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered bounce plan. Its code is unique within a tenant. */
export class TieredBouncePlan {
  code: string;
  label: string;
  ratio: number;
  expiresAt: number;
  budget: number;
  locale: string;
  ownerId: string;
  batchSize: number;
  attributes: Map<string, string>;
  floorValue: number;
  channel: string;
  status: TieredBouncePlanStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    expiresAt: number,
    budget: number,
    locale: string,
    ownerId: string,
    batchSize: number,
    attributes: Map<string, string>,
    floorValue: number,
    channel: string,
    status: TieredBouncePlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.locale = locale;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.attributes = attributes;
    this.floorValue = floorValue;
    this.channel = channel;
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

  canMoveTo(next: TieredBouncePlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TieredBouncePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bounce plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered bounce plan"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round(this.expiresAt * this.budget * 100) / 100;
  }

  copy(): TieredBouncePlan {
    return new TieredBouncePlan(
      this.code,
      this.label,
      this.ratio,
      this.expiresAt,
      this.budget,
      this.locale,
      this.ownerId,
      this.batchSize,
      this.attributes,
      this.floorValue,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered bounce plan in status proposed. */
export function newTieredBouncePlan(code: string, label: string): TieredBouncePlan {
  return new TieredBouncePlan(code, label, 0, 0, 0, "", "", 0, new Map<string, string>(), 0, "", "proposed");
}
