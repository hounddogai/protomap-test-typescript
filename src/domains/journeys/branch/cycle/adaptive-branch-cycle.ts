/**
 * The adaptive branch cycle records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive branch cycle is in its life cycle. */
export type AdaptiveBranchCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive branch cycle as the branch team keeps it. */
export class AdaptiveBranchCycle {
  code: string;
  label: string;
  channel: string;
  ownerId: string;
  createdAt: number;
  batchSize: number;
  frequencyCap: number;
  active: boolean;
  revision: number;
  priority: number;
  cohort: string;
  status: AdaptiveBranchCycleStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    ownerId: string,
    createdAt: number,
    batchSize: number,
    frequencyCap: number,
    active: boolean,
    revision: number,
    priority: number,
    cohort: string,
    status: AdaptiveBranchCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.active = active;
    this.revision = revision;
    this.priority = priority;
    this.cohort = cohort;
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

  canMoveTo(next: AdaptiveBranchCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveBranchCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive branch cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.priority - this.batchSize) * 100) / 100;
  }

  copy(): AdaptiveBranchCycle {
    return new AdaptiveBranchCycle(
      this.code,
      this.label,
      this.channel,
      this.ownerId,
      this.createdAt,
      this.batchSize,
      this.frequencyCap,
      this.active,
      this.revision,
      this.priority,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive branch cycle in status requested. */
export function newAdaptiveBranchCycle(code: string, label: string): AdaptiveBranchCycle {
  return new AdaptiveBranchCycle(code, label, "", "", 0, 0, 0, false, 0, 0, "", "requested");
}
