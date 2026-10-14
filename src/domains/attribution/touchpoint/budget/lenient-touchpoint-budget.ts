/**
 * The lenient touchpoint budget records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient touchpoint budget is in its life cycle. */
export type LenientTouchpointBudgetStatus = "created" | "validated" | "published" | "retired";

/** One lenient touchpoint budget, with what the planners need to act on it. */
export class LenientTouchpointBudget {
  code: string;
  label: string;
  impressions: number;
  phone: string;
  batchSize: number;
  durationMinutes: number;
  visible: boolean;
  source: string;
  segment: string;
  summary: string;
  status: LenientTouchpointBudgetStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    phone: string,
    batchSize: number,
    durationMinutes: number,
    visible: boolean,
    source: string,
    segment: string,
    summary: string,
    status: LenientTouchpointBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.phone = phone;
    this.batchSize = batchSize;
    this.durationMinutes = durationMinutes;
    this.visible = visible;
    this.source = source;
    this.segment = segment;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientTouchpointBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientTouchpointBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient touchpoint budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round((this.impressions + this.durationMinutes) * 100) / 100;
  }

  copy(): LenientTouchpointBudget {
    return new LenientTouchpointBudget(
      this.code,
      this.label,
      this.impressions,
      this.phone,
      this.batchSize,
      this.durationMinutes,
      this.visible,
      this.source,
      this.segment,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient touchpoint budget in status created. */
export function newLenientTouchpointBudget(code: string, label: string): LenientTouchpointBudget {
  return new LenientTouchpointBudget(code, label, 0, "", 0, 0, false, "", "", "", "created");
}
