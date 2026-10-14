/**
 * The rolling step segment records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling step segment is in its life cycle. */
export type RollingStepSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling step segment. Its code is unique within a tenant. */
export class RollingStepSegment {
  code: string;
  title: string;
  openRate: number;
  checksum: string;
  notes: string;
  cohort: string;
  batchSize: number;
  ceiling: number;
  channel: string;
  retries: number;
  score: number;
  status: RollingStepSegmentStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    checksum: string,
    notes: string,
    cohort: string,
    batchSize: number,
    ceiling: number,
    channel: string,
    retries: number,
    score: number,
    status: RollingStepSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.checksum = checksum;
    this.notes = notes;
    this.cohort = cohort;
    this.batchSize = batchSize;
    this.ceiling = ceiling;
    this.channel = channel;
    this.retries = retries;
    this.score = score;
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

  canMoveTo(next: RollingStepSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingStepSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling step segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling step segment"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.retries + this.openRate) * 100) / 100;
  }

  copy(): RollingStepSegment {
    return new RollingStepSegment(
      this.code,
      this.title,
      this.openRate,
      this.checksum,
      this.notes,
      this.cohort,
      this.batchSize,
      this.ceiling,
      this.channel,
      this.retries,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling step segment in status requested. */
export function newRollingStepSegment(code: string, title: string): RollingStepSegment {
  return new RollingStepSegment(code, title, 0, "", "", "", 0, 0, "", 0, 0, "requested");
}
