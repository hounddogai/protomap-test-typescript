/**
 * The sender checkpoint records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender checkpoint is in its life cycle. */
export type SenderCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A sender checkpoint as the sender team keeps it. */
export class SenderCheckpoint {
  code: string;
  name: string;
  externalRef: string;
  version: number;
  attempts: number;
  status: SenderCheckpointStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    version: number,
    attempts: number,
    status: SenderCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.version = version;
    this.attempts = attempts;
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

  canMoveTo(next: SenderCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round(this.attempts * this.version * 100) / 100;
  }

  copy(): SenderCheckpoint {
    return new SenderCheckpoint(this.code, this.name, this.externalRef, this.version, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sender checkpoint in status draft. */
export function newSenderCheckpoint(code: string, name: string): SenderCheckpoint {
  return new SenderCheckpoint(code, name, "", 0, 0, "draft");
}
