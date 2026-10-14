import * as text from "../../../../kit/text.js";

/** Where a weighted paywall snapshot is in its life cycle. */
export type WeightedPaywallSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted paywall snapshot as the paywall team keeps it. */
export class WeightedPaywallSnapshot {
  code: string;
  label: string;
  ownerId: string;
  variant: string;
  weight: number;
  sequence: number;
  status: WeightedPaywallSnapshotStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    variant: string,
    weight: number,
    sequence: number,
    status: WeightedPaywallSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.variant = variant;
    this.weight = weight;
    this.sequence = sequence;
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

  canMoveTo(next: WeightedPaywallSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPaywallSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted paywall snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.weight - this.sequence) * 100) / 100;
  }

  copy(): WeightedPaywallSnapshot {
    return new WeightedPaywallSnapshot(
      this.code,
      this.label,
      this.ownerId,
      this.variant,
      this.weight,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted paywall snapshot in status new. */
export function newWeightedPaywallSnapshot(code: string, label: string): WeightedPaywallSnapshot {
  return new WeightedPaywallSnapshot(code, label, "", "", 0, 0, "new");
}
