/**
 * The tiered level preference records of loyaltyhub's level work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered level preference is in its life cycle. */
export type TieredLevelPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a tiered level preference and its current status. */
export class TieredLevelPreference {
  code: string;
  label: string;
  campaignRef: string;
  budget: number;
  category: string;
  batchSize: number;
  status: TieredLevelPreferenceStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    budget: number,
    category: string,
    batchSize: number,
    status: TieredLevelPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.category = category;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredLevelPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredLevelPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered level preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.budget + this.batchSize) * 100) / 100;
  }

  copy(): TieredLevelPreference {
    return new TieredLevelPreference(
      this.code,
      this.label,
      this.campaignRef,
      this.budget,
      this.category,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered level preference in status new. */
export function newTieredLevelPreference(code: string, label: string): TieredLevelPreference {
  return new TieredLevelPreference(code, label, "", 0, "", 0, "new");
}
