/**
 * The capped enrollment estimate records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped enrollment estimate is in its life cycle. */
export type CappedEnrollmentEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One capped enrollment estimate, with what the planners need to act on it. */
export class CappedEnrollmentEstimate {
  code: string;
  title: string;
  attributes: Map<string, string>;
  capacity: number;
  externalRef: string;
  reviewer: string;
  margin: number;
  budget: number;
  openRate: number;
  status: CappedEnrollmentEstimateStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    capacity: number,
    externalRef: string,
    reviewer: string,
    margin: number,
    budget: number,
    openRate: number,
    status: CappedEnrollmentEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.capacity = capacity;
    this.externalRef = externalRef;
    this.reviewer = reviewer;
    this.margin = margin;
    this.budget = budget;
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

  canMoveTo(next: CappedEnrollmentEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedEnrollmentEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped enrollment estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped enrollment estimate"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round((this.budget + this.margin) * 100) / 100;
  }

  copy(): CappedEnrollmentEstimate {
    return new CappedEnrollmentEstimate(
      this.code,
      this.title,
      this.attributes,
      this.capacity,
      this.externalRef,
      this.reviewer,
      this.margin,
      this.budget,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped enrollment estimate in status idle. */
export function newCappedEnrollmentEstimate(code: string, title: string): CappedEnrollmentEstimate {
  return new CappedEnrollmentEstimate(code, title, new Map<string, string>(), 0, "", "", 0, 0, 0, "idle");
}
