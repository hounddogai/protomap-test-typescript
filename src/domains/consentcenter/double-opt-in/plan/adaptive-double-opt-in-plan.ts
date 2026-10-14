/**
 * The adaptive double opt in plan records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive double opt in plan is in its life cycle. */
export type AdaptiveDoubleOptInPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive double opt in plan as the double opt in team keeps it. */
export class AdaptiveDoubleOptInPlan {
  code: string;
  label: string;
  title: string;
  utmSource: string;
  graceDays: number;
  source: string;
  reviewer: string;
  checksum: string;
  archived: boolean;
  status: AdaptiveDoubleOptInPlanStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    utmSource: string,
    graceDays: number,
    source: string,
    reviewer: string,
    checksum: string,
    archived: boolean,
    status: AdaptiveDoubleOptInPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.utmSource = utmSource;
    this.graceDays = graceDays;
    this.source = source;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.archived = archived;
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

  canMoveTo(next: AdaptiveDoubleOptInPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveDoubleOptInPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive double opt in plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive double opt in plan"} ${this.code}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): AdaptiveDoubleOptInPlan {
    return new AdaptiveDoubleOptInPlan(
      this.code,
      this.label,
      this.title,
      this.utmSource,
      this.graceDays,
      this.source,
      this.reviewer,
      this.checksum,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive double opt in plan in status idle. */
export function newAdaptiveDoubleOptInPlan(code: string, label: string): AdaptiveDoubleOptInPlan {
  return new AdaptiveDoubleOptInPlan(code, label, "", "", 0, "", "", "", false, "idle");
}
