/**
 * The conversion tier records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion tier is in its life cycle. */
export type ConversionTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A conversion tier. Its code is unique within a tenant. */
export class ConversionTier {
  code: string;
  title: string;
  currency: string;
  budget: number;
  attributes: Map<string, string>;
  visible: boolean;
  utmSource: string;
  amount: number;
  status: ConversionTierStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    budget: number,
    attributes: Map<string, string>,
    visible: boolean,
    utmSource: string,
    amount: number,
    status: ConversionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.budget = budget;
    this.attributes = attributes;
    this.visible = visible;
    this.utmSource = utmSource;
    this.amount = amount;
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

  canMoveTo(next: ConversionTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "stopped";
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

  moveTo(next: ConversionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round(this.amount * this.budget * 100) / 100;
  }

  copy(): ConversionTier {
    return new ConversionTier(
      this.code,
      this.title,
      this.currency,
      this.budget,
      this.attributes,
      this.visible,
      this.utmSource,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a conversion tier in status idle. */
export function newConversionTier(code: string, title: string): ConversionTier {
  return new ConversionTier(code, title, "", 0, new Map<string, string>(), false, "", 0, "idle");
}
