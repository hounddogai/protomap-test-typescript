/**
 * The reward summary records of loyaltyhub's reward work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward summary is in its life cycle. */
export type RewardSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** A reward summary. Its code is unique within a tenant. */
export class RewardSummary {
  code: string;
  name: string;
  durationMinutes: number;
  cohort: string;
  label: string;
  priority: number;
  journeyId: string;
  ownerId: string;
  floorValue: number;
  status: RewardSummaryStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    cohort: string,
    label: string,
    priority: number,
    journeyId: string,
    ownerId: string,
    floorValue: number,
    status: RewardSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.cohort = cohort;
    this.label = label;
    this.priority = priority;
    this.journeyId = journeyId;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
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

  canMoveTo(next: RewardSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RewardSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reward summary"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.durationMinutes + this.priority) * 100) / 100;
  }

  copy(): RewardSummary {
    return new RewardSummary(
      this.code,
      this.name,
      this.durationMinutes,
      this.cohort,
      this.label,
      this.priority,
      this.journeyId,
      this.ownerId,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward summary in status requested. */
export function newRewardSummary(code: string, name: string): RewardSummary {
  return new RewardSummary(code, name, 0, "", "", 0, "", "", 0, "requested");
}
