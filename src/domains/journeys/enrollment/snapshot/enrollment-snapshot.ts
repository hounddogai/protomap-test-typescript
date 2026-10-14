/**
 * The enrollment snapshot records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment snapshot is in its life cycle. */
export type EnrollmentSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a enrollment snapshot and its current status. */
export class EnrollmentSnapshot {
  code: string;
  title: string;
  updatedAt: number;
  variant: string;
  weight: number;
  audienceId: string;
  status: EnrollmentSnapshotStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    variant: string,
    weight: number,
    audienceId: string,
    status: EnrollmentSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.variant = variant;
    this.weight = weight;
    this.audienceId = audienceId;
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

  canMoveTo(next: EnrollmentSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: EnrollmentSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.weight - this.updatedAt) * 100) / 100;
  }

  copy(): EnrollmentSnapshot {
    return new EnrollmentSnapshot(
      this.code,
      this.title,
      this.updatedAt,
      this.variant,
      this.weight,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a enrollment snapshot in status new. */
export function newEnrollmentSnapshot(code: string, title: string): EnrollmentSnapshot {
  return new EnrollmentSnapshot(code, title, 0, "", 0, "", "new");
}
