import * as text from "../../../../kit/text.js";

/** Where a pending bounce score is in its life cycle. */
export type PendingBounceScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending bounce score as the bounce team keeps it. */
export class PendingBounceScore {
  code: string;
  label: string;
  unit: string;
  maximum: number;
  margin: number;
  status: PendingBounceScoreStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    maximum: number,
    margin: number,
    status: PendingBounceScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.maximum = maximum;
    this.margin = margin;
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

  canMoveTo(next: PendingBounceScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingBounceScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bounce score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round(this.margin * this.maximum * 100) / 100;
  }

  copy(): PendingBounceScore {
    return new PendingBounceScore(this.code, this.label, this.unit, this.maximum, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending bounce score in status idle. */
export function newPendingBounceScore(code: string, label: string): PendingBounceScore {
  return new PendingBounceScore(code, label, "", 0, 0, "idle");
}
