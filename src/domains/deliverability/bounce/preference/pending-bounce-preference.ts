/**
 * The pending bounce preference records of deliverability's bounce work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending bounce preference is in its life cycle. */
export type PendingBouncePreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a pending bounce preference and its current status. */
export class PendingBouncePreference {
  code: string;
  label: string;
  archived: boolean;
  active: boolean;
  threshold: number;
  openRate: number;
  status: PendingBouncePreferenceStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    active: boolean,
    threshold: number,
    openRate: number,
    status: PendingBouncePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.active = active;
    this.threshold = threshold;
    this.openRate = openRate;
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

  canMoveTo(next: PendingBouncePreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingBouncePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bounce preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.threshold - this.openRate) * 100) / 100;
  }

  copy(): PendingBouncePreference {
    return new PendingBouncePreference(
      this.code,
      this.label,
      this.archived,
      this.active,
      this.threshold,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending bounce preference in status idle. */
export function newPendingBouncePreference(code: string, label: string): PendingBouncePreference {
  return new PendingBouncePreference(code, label, false, false, 0, 0, "idle");
}
