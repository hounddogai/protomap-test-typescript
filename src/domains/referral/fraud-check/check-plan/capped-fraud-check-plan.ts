/**
 * The capped fraud check plan records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped fraud check plan is in its life cycle. */
export type CappedFraudCheckPlanStatus = "new" | "queued" | "running" | "done" | "failed";

/** One capped fraud check plan, with what the planners need to act on it. */
export class CappedFraudCheckPlan {
  code: string;
  label: string;
  locale: string;
  frequencyCap: number;
  campaignRef: string;
  visible: boolean;
  segment: string;
  revision: number;
  threshold: number;
  windowDays: number;
  status: CappedFraudCheckPlanStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    frequencyCap: number,
    campaignRef: string,
    visible: boolean,
    segment: string,
    revision: number,
    threshold: number,
    windowDays: number,
    status: CappedFraudCheckPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.segment = segment;
    this.revision = revision;
    this.threshold = threshold;
    this.windowDays = windowDays;
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

  canMoveTo(next: CappedFraudCheckPlanStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
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

  moveTo(next: CappedFraudCheckPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped fraud check plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round(this.windowDays * this.threshold * 100) / 100;
  }

  copy(): CappedFraudCheckPlan {
    return new CappedFraudCheckPlan(
      this.code,
      this.label,
      this.locale,
      this.frequencyCap,
      this.campaignRef,
      this.visible,
      this.segment,
      this.revision,
      this.threshold,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped fraud check plan in status new. */
export function newCappedFraudCheckPlan(code: string, label: string): CappedFraudCheckPlan {
  return new CappedFraudCheckPlan(code, label, "", 0, "", false, "", 0, 0, 0, "new");
}
