import * as text from "../../../../kit/text.js";

/** Where a legacy tier checkpoint is in its life cycle. */
export type LegacyTierCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy tier checkpoint as the tier team keeps it. */
export class LegacyTierCheckpoint {
  code: string;
  label: string;
  threshold: number;
  discount: number;
  priority: number;
  status: LegacyTierCheckpointStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    discount: number,
    priority: number,
    status: LegacyTierCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.discount = discount;
    this.priority = priority;
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

  canMoveTo(next: LegacyTierCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyTierCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy tier checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.discount - this.threshold) * 100) / 100;
  }

  copy(): LegacyTierCheckpoint {
    return new LegacyTierCheckpoint(this.code, this.label, this.threshold, this.discount, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy tier checkpoint in status idle. */
export function newLegacyTierCheckpoint(code: string, label: string): LegacyTierCheckpoint {
  return new LegacyTierCheckpoint(code, label, 0, 0, 0, "idle");
}
