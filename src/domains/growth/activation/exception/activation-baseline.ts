import * as text from "../../../../kit/text.js";

/** Where a activation baseline is in its life cycle. */
export type ActivationBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A activation baseline as the activation team keeps it. */
export class ActivationBaseline {
  code: string;
  label: string;
  batchSize: number;
  pinned: boolean;
  unit: string;
  priority: number;
  status: ActivationBaselineStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    pinned: boolean,
    unit: string,
    priority: number,
    status: ActivationBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.pinned = pinned;
    this.unit = unit;
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

  canMoveTo(next: ActivationBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
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

  moveTo(next: ActivationBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.batchSize + this.priority) * 100) / 100;
  }

  copy(): ActivationBaseline {
    return new ActivationBaseline(
      this.code,
      this.label,
      this.batchSize,
      this.pinned,
      this.unit,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a activation baseline in status idle. */
export function newActivationBaseline(code: string, label: string): ActivationBaseline {
  return new ActivationBaseline(code, label, 0, false, "", 0, "idle");
}
