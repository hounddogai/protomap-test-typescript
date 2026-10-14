/**
 * The warmup baseline records of deliverability's warmup work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup baseline is in its life cycle. */
export type WarmupBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One warmup baseline, with what the planners need to act on it. */
export class WarmupBaseline {
  code: string;
  name: string;
  conversionRate: number;
  expiresAt: number;
  attributes: Map<string, string>;
  graceDays: number;
  rate: number;
  status: WarmupBaselineStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    expiresAt: number,
    attributes: Map<string, string>,
    graceDays: number,
    rate: number,
    status: WarmupBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.attributes = attributes;
    this.graceDays = graceDays;
    this.rate = rate;
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

  canMoveTo(next: WarmupBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedLoad(): number {
    return Math.round(this.expiresAt * this.graceDays * 100) / 100;
  }

  copy(): WarmupBaseline {
    return new WarmupBaseline(
      this.code,
      this.name,
      this.conversionRate,
      this.expiresAt,
      this.attributes,
      this.graceDays,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a warmup baseline in status proposed. */
export function newWarmupBaseline(code: string, name: string): WarmupBaseline {
  return new WarmupBaseline(code, name, 0, 0, new Map<string, string>(), 0, 0, "proposed");
}
