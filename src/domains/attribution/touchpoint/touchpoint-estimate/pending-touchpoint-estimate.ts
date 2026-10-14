/**
 * The pending touchpoint estimate records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending touchpoint estimate is in its life cycle. */
export type PendingTouchpointEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One pending touchpoint estimate, with what the planners need to act on it. */
export class PendingTouchpointEstimate {
  code: string;
  name: string;
  frequencyCap: number;
  segment: string;
  expiresAt: number;
  updatedAt: number;
  cohort: string;
  ownerId: string;
  reviewer: string;
  status: PendingTouchpointEstimateStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    segment: string,
    expiresAt: number,
    updatedAt: number,
    cohort: string,
    ownerId: string,
    reviewer: string,
    status: PendingTouchpointEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
    this.cohort = cohort;
    this.ownerId = ownerId;
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

  canMoveTo(next: PendingTouchpointEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingTouchpointEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending touchpoint estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round((this.updatedAt + this.expiresAt) * 100) / 100;
  }

  copy(): PendingTouchpointEstimate {
    return new PendingTouchpointEstimate(
      this.code,
      this.name,
      this.frequencyCap,
      this.segment,
      this.expiresAt,
      this.updatedAt,
      this.cohort,
      this.ownerId,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending touchpoint estimate in status planned. */
export function newPendingTouchpointEstimate(code: string, name: string): PendingTouchpointEstimate {
  return new PendingTouchpointEstimate(code, name, 0, "", 0, 0, "", "", "", "planned");
}
