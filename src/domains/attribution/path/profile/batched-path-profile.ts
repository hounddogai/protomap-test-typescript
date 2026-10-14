/**
 * The batched path profile records of attribution's path work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched path profile is in its life cycle. */
export type BatchedPathProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched path profile as the path team keeps it. */
export class BatchedPathProfile {
  code: string;
  label: string;
  timezone: string;
  budget: number;
  active: boolean;
  ownerId: string;
  status: BatchedPathProfileStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    budget: number,
    active: boolean,
    ownerId: string,
    status: BatchedPathProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.budget = budget;
    this.active = active;
    this.ownerId = ownerId;
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

  canMoveTo(next: BatchedPathProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPathProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched path profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): BatchedPathProfile {
    return new BatchedPathProfile(
      this.code,
      this.label,
      this.timezone,
      this.budget,
      this.active,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched path profile in status idle. */
export function newBatchedPathProfile(code: string, label: string): BatchedPathProfile {
  return new BatchedPathProfile(code, label, "", 0, false, "", "idle");
}
