/**
 * The regional suppression profile records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional suppression profile is in its life cycle. */
export type RegionalSuppressionProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One regional suppression profile, with what the planners need to act on it. */
export class RegionalSuppressionProfile {
  code: string;
  label: string;
  score: number;
  active: boolean;
  bid: number;
  region: string;
  durationMinutes: number;
  endsAt: number;
  batchSize: number;
  rate: number;
  reviewer: string;
  status: RegionalSuppressionProfileStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    active: boolean,
    bid: number,
    region: string,
    durationMinutes: number,
    endsAt: number,
    batchSize: number,
    rate: number,
    reviewer: string,
    status: RegionalSuppressionProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.active = active;
    this.bid = bid;
    this.region = region;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
    this.batchSize = batchSize;
    this.rate = rate;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalSuppressionProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSuppressionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional suppression profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netLoad(): number {
    return Math.round((this.durationMinutes - this.bid) * 100) / 100;
  }

  copy(): RegionalSuppressionProfile {
    return new RegionalSuppressionProfile(
      this.code,
      this.label,
      this.score,
      this.active,
      this.bid,
      this.region,
      this.durationMinutes,
      this.endsAt,
      this.batchSize,
      this.rate,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional suppression profile in status planned. */
export function newRegionalSuppressionProfile(code: string, label: string): RegionalSuppressionProfile {
  return new RegionalSuppressionProfile(code, label, 0, false, 0, "", 0, 0, 0, 0, "", "planned");
}
