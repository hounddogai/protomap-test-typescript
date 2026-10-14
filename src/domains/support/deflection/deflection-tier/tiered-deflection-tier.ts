/**
 * The tiered deflection tier records of support's deflection work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered deflection tier is in its life cycle. */
export type TieredDeflectionTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One tiered deflection tier, with what the planners need to act on it. */
export class TieredDeflectionTier {
  code: string;
  label: string;
  attributes: Map<string, string>;
  windowDays: number;
  attempts: number;
  ratio: number;
  durationMinutes: number;
  status: TieredDeflectionTierStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    windowDays: number,
    attempts: number,
    ratio: number,
    durationMinutes: number,
    status: TieredDeflectionTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.windowDays = windowDays;
    this.attempts = attempts;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: TieredDeflectionTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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

  moveTo(next: TieredDeflectionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered deflection tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered deflection tier"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round(this.windowDays * this.attempts * 100) / 100;
  }

  copy(): TieredDeflectionTier {
    return new TieredDeflectionTier(
      this.code,
      this.label,
      this.attributes,
      this.windowDays,
      this.attempts,
      this.ratio,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered deflection tier in status proposed. */
export function newTieredDeflectionTier(code: string, label: string): TieredDeflectionTier {
  return new TieredDeflectionTier(code, label, new Map<string, string>(), 0, 0, 0, 0, "proposed");
}
