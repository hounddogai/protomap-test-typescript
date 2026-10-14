/**
 * The primary nudge profile records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary nudge profile is in its life cycle. */
export type PrimaryNudgeProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary nudge profile. Its code is unique within a tenant. */
export class PrimaryNudgeProfile {
  code: string;
  label: string;
  pinned: boolean;
  ratio: number;
  locale: string;
  timezone: string;
  maximum: number;
  cost: number;
  rate: number;
  cohort: string;
  variant: string;
  status: PrimaryNudgeProfileStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    ratio: number,
    locale: string,
    timezone: string,
    maximum: number,
    cost: number,
    rate: number,
    cohort: string,
    variant: string,
    status: PrimaryNudgeProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.ratio = ratio;
    this.locale = locale;
    this.timezone = timezone;
    this.maximum = maximum;
    this.cost = cost;
    this.rate = rate;
    this.cohort = cohort;
    this.variant = variant;
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

  canMoveTo(next: PrimaryNudgeProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimaryNudgeProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary nudge profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round(this.ratio * this.maximum * 100) / 100;
  }

  copy(): PrimaryNudgeProfile {
    return new PrimaryNudgeProfile(
      this.code,
      this.label,
      this.pinned,
      this.ratio,
      this.locale,
      this.timezone,
      this.maximum,
      this.cost,
      this.rate,
      this.cohort,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary nudge profile in status idle. */
export function newPrimaryNudgeProfile(code: string, label: string): PrimaryNudgeProfile {
  return new PrimaryNudgeProfile(code, label, false, 0, "", "", 0, 0, 0, "", "", "idle");
}
