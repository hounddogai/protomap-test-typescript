/**
 * The cohort checkpoint records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort checkpoint is in its life cycle. */
export type CohortCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A cohort checkpoint as the cohort team keeps it. */
export class CohortCheckpoint {
  code: string;
  name: string;
  phone: string;
  durationMinutes: number;
  impressions: number;
  version: number;
  status: CohortCheckpointStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    durationMinutes: number,
    impressions: number,
    version: number,
    status: CohortCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.durationMinutes = durationMinutes;
    this.impressions = impressions;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CohortCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.impressions - this.version) * 100) / 100;
  }

  copy(): CohortCheckpoint {
    return new CohortCheckpoint(
      this.code,
      this.name,
      this.phone,
      this.durationMinutes,
      this.impressions,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a cohort checkpoint in status draft. */
export function newCohortCheckpoint(code: string, name: string): CohortCheckpoint {
  return new CohortCheckpoint(code, name, "", 0, 0, 0, "draft");
}
