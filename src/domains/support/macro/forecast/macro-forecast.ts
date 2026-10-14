/**
 * The macro forecast records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro forecast is in its life cycle. */
export type MacroForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a macro forecast and its current status. */
export class MacroForecast {
  code: string;
  label: string;
  externalRef: string;
  cost: number;
  margin: number;
  variant: string;
  ownerId: string;
  status: MacroForecastStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    cost: number,
    margin: number,
    variant: string,
    ownerId: string,
    status: MacroForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.cost = cost;
    this.margin = margin;
    this.variant = variant;
    this.ownerId = ownerId;
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

  canMoveTo(next: MacroForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: MacroForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedExposure(): number {
    return Math.round((this.cost + this.margin) * 100) / 100;
  }

  copy(): MacroForecast {
    return new MacroForecast(
      this.code,
      this.label,
      this.externalRef,
      this.cost,
      this.margin,
      this.variant,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro forecast in status draft. */
export function newMacroForecast(code: string, label: string): MacroForecast {
  return new MacroForecast(code, label, "", 0, 0, "", "", "draft");
}
