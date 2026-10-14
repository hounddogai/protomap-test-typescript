/**
 * The primary reward rule forecast records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary reward rule forecast is in its life cycle. */
export type PrimaryRewardRuleForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary reward rule forecast and its current status. */
export class PrimaryRewardRuleForecast {
  code: string;
  label: string;
  ceiling: number;
  createdAt: number;
  utmSource: string;
  status: PrimaryRewardRuleForecastStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    createdAt: number,
    utmSource: string,
    status: PrimaryRewardRuleForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.createdAt = createdAt;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryRewardRuleForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryRewardRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary reward rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary reward rule forecast"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.createdAt * this.ceiling * 100) / 100;
  }

  copy(): PrimaryRewardRuleForecast {
    return new PrimaryRewardRuleForecast(
      this.code,
      this.label,
      this.ceiling,
      this.createdAt,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary reward rule forecast in status requested. */
export function newPrimaryRewardRuleForecast(code: string, label: string): PrimaryRewardRuleForecast {
  return new PrimaryRewardRuleForecast(code, label, 0, 0, "", "requested");
}
