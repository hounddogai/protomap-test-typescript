/**
 * The wait adjustment records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait adjustment is in its life cycle. */
export type WaitAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a wait adjustment and its current status. */
export class WaitAdjustment {
  code: string;
  name: string;
  margin: number;
  impressions: number;
  retries: number;
  ceiling: number;
  updatedAt: number;
  utmSource: string;
  notes: string;
  status: WaitAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    impressions: number,
    retries: number,
    ceiling: number,
    updatedAt: number,
    utmSource: string,
    notes: string,
    status: WaitAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.impressions = impressions;
    this.retries = retries;
    this.ceiling = ceiling;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.notes = notes;
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

  canMoveTo(next: WaitAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WaitAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedLoad(): number {
    return Math.round((this.impressions - this.updatedAt) * 100) / 100;
  }

  copy(): WaitAdjustment {
    return new WaitAdjustment(
      this.code,
      this.name,
      this.margin,
      this.impressions,
      this.retries,
      this.ceiling,
      this.updatedAt,
      this.utmSource,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a wait adjustment in status requested. */
export function newWaitAdjustment(code: string, name: string): WaitAdjustment {
  return new WaitAdjustment(code, name, 0, 0, 0, 0, 0, "", "", "requested");
}
