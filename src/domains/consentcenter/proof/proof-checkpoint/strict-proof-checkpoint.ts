/**
 * The strict proof checkpoint records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict proof checkpoint is in its life cycle. */
export type StrictProofCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict proof checkpoint as the proof team keeps it. */
export class StrictProofCheckpoint {
  code: string;
  name: string;
  startsAt: number;
  revision: number;
  journeyId: string;
  status: StrictProofCheckpointStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    revision: number,
    journeyId: string,
    status: StrictProofCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.revision = revision;
    this.journeyId = journeyId;
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

  canMoveTo(next: StrictProofCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictProofCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict proof checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.revision * this.startsAt * 100) / 100;
  }

  copy(): StrictProofCheckpoint {
    return new StrictProofCheckpoint(this.code, this.name, this.startsAt, this.revision, this.journeyId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict proof checkpoint in status planned. */
export function newStrictProofCheckpoint(code: string, name: string): StrictProofCheckpoint {
  return new StrictProofCheckpoint(code, name, 0, 0, "", "planned");
}
