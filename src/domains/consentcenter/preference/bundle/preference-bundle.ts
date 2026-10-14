/**
 * The preference bundle records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference bundle is in its life cycle. */
export type PreferenceBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a preference bundle and its current status. */
export class PreferenceBundle {
  code: string;
  label: string;
  openRate: number;
  budget: number;
  threshold: number;
  audienceId: string;
  status: PreferenceBundleStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    budget: number,
    threshold: number,
    audienceId: string,
    status: PreferenceBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.budget = budget;
    this.threshold = threshold;
    this.audienceId = audienceId;
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

  canMoveTo(next: PreferenceBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PreferenceBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"preference bundle"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.openRate * this.budget * 100) / 100;
  }

  copy(): PreferenceBundle {
    return new PreferenceBundle(
      this.code,
      this.label,
      this.openRate,
      this.budget,
      this.threshold,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a preference bundle in status new. */
export function newPreferenceBundle(code: string, label: string): PreferenceBundle {
  return new PreferenceBundle(code, label, 0, 0, 0, "", "new");
}
