/**
 * The legacy nudge forecast records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy nudge forecast is in its life cycle. */
export type LegacyNudgeForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** One legacy nudge forecast, with what the planners need to act on it. */
export class LegacyNudgeForecast {
  code: string;
  label: string;
  summary: string;
  quantity: number;
  version: number;
  name: string;
  budget: number;
  status: LegacyNudgeForecastStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    quantity: number,
    version: number,
    name: string,
    budget: number,
    status: LegacyNudgeForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.quantity = quantity;
    this.version = version;
    this.name = name;
    this.budget = budget;
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

  canMoveTo(next: LegacyNudgeForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyNudgeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy nudge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.quantity * this.version * 100) / 100;
  }

  copy(): LegacyNudgeForecast {
    return new LegacyNudgeForecast(
      this.code,
      this.label,
      this.summary,
      this.quantity,
      this.version,
      this.name,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy nudge forecast in status requested. */
export function newLegacyNudgeForecast(code: string, label: string): LegacyNudgeForecast {
  return new LegacyNudgeForecast(code, label, "", 0, 0, "", 0, "requested");
}
