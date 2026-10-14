/**
 * The weighted placement snapshot records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted placement snapshot is in its life cycle. */
export type WeightedPlacementSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted placement snapshot, with what the planners need to act on it. */
export class WeightedPlacementSnapshot {
  code: string;
  label: string;
  channel: string;
  updatedAt: number;
  openRate: number;
  frequencyCap: number;
  category: string;
  priority: number;
  status: WeightedPlacementSnapshotStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    updatedAt: number,
    openRate: number,
    frequencyCap: number,
    category: string,
    priority: number,
    status: WeightedPlacementSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedPlacementSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedPlacementSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted placement snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.priority + this.openRate) * 100) / 100;
  }

  copy(): WeightedPlacementSnapshot {
    return new WeightedPlacementSnapshot(
      this.code,
      this.label,
      this.channel,
      this.updatedAt,
      this.openRate,
      this.frequencyCap,
      this.category,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted placement snapshot in status proposed. */
export function newWeightedPlacementSnapshot(code: string, label: string): WeightedPlacementSnapshot {
  return new WeightedPlacementSnapshot(code, label, "", 0, 0, 0, "", 0, "proposed");
}
