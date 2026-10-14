/**
 * The global bounce summary records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global bounce summary is in its life cycle. */
export type GlobalBounceSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global bounce summary. Its code is unique within a tenant. */
export class GlobalBounceSummary {
  code: string;
  name: string;
  sendAt: number;
  threshold: number;
  floorValue: number;
  title: string;
  ratio: number;
  batchSize: number;
  cohort: string;
  retries: number;
  active: boolean;
  status: GlobalBounceSummaryStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    threshold: number,
    floorValue: number,
    title: string,
    ratio: number,
    batchSize: number,
    cohort: string,
    retries: number,
    active: boolean,
    status: GlobalBounceSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.threshold = threshold;
    this.floorValue = floorValue;
    this.title = title;
    this.ratio = ratio;
    this.batchSize = batchSize;
    this.cohort = cohort;
    this.retries = retries;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalBounceSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalBounceSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global bounce summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.floorValue - this.retries) * 100) / 100;
  }

  copy(): GlobalBounceSummary {
    return new GlobalBounceSummary(
      this.code,
      this.name,
      this.sendAt,
      this.threshold,
      this.floorValue,
      this.title,
      this.ratio,
      this.batchSize,
      this.cohort,
      this.retries,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global bounce summary in status proposed. */
export function newGlobalBounceSummary(code: string, name: string): GlobalBounceSummary {
  return new GlobalBounceSummary(code, name, 0, 0, 0, "", 0, 0, "", 0, false, "proposed");
}
