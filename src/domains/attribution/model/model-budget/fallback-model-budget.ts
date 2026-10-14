/**
 * The fallback model budget records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback model budget is in its life cycle. */
export type FallbackModelBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback model budget and its current status. */
export class FallbackModelBudget {
  code: string;
  label: string;
  externalRef: string;
  utmSource: string;
  sequence: number;
  floorValue: number;
  source: string;
  approved: boolean;
  status: FallbackModelBudgetStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    utmSource: string,
    sequence: number,
    floorValue: number,
    source: string,
    approved: boolean,
    status: FallbackModelBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.utmSource = utmSource;
    this.sequence = sequence;
    this.floorValue = floorValue;
    this.source = source;
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

  canMoveTo(next: FallbackModelBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: FallbackModelBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback model budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback model budget"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.sequence * this.floorValue * 100) / 100;
  }

  copy(): FallbackModelBudget {
    return new FallbackModelBudget(
      this.code,
      this.label,
      this.externalRef,
      this.utmSource,
      this.sequence,
      this.floorValue,
      this.source,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback model budget in status idle. */
export function newFallbackModelBudget(code: string, label: string): FallbackModelBudget {
  return new FallbackModelBudget(code, label, "", "", 0, 0, "", false, "idle");
}
