/**
 * The legacy queue checkpoint records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy queue checkpoint is in its life cycle. */
export type LegacyQueueCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A legacy queue checkpoint. Its code is unique within a tenant. */
export class LegacyQueueCheckpoint {
  code: string;
  label: string;
  approved: boolean;
  archived: boolean;
  cost: number;
  status: LegacyQueueCheckpointStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    archived: boolean,
    cost: number,
    status: LegacyQueueCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.archived = archived;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyQueueCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyQueueCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy queue checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy queue checkpoint"} ${this.code}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): LegacyQueueCheckpoint {
    return new LegacyQueueCheckpoint(this.code, this.label, this.approved, this.archived, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy queue checkpoint in status created. */
export function newLegacyQueueCheckpoint(code: string, label: string): LegacyQueueCheckpoint {
  return new LegacyQueueCheckpoint(code, label, false, false, 0, "created");
}
