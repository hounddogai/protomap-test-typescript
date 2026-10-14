import * as text from "../../../../kit/text.js";

/** Where a fraud check score is in its life cycle. */
export type FraudCheckScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fraud check score as the fraud check team keeps it. */
export class FraudCheckScore {
  code: string;
  name: string;
  openRate: number;
  minimum: number;
  pinned: boolean;
  attempts: number;
  status: FraudCheckScoreStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    minimum: number,
    pinned: boolean,
    attempts: number,
    status: FraudCheckScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.minimum = minimum;
    this.pinned = pinned;
    this.attempts = attempts;
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

  canMoveTo(next: FraudCheckScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.openRate - this.minimum) * 100) / 100;
  }

  copy(): FraudCheckScore {
    return new FraudCheckScore(
      this.code,
      this.name,
      this.openRate,
      this.minimum,
      this.pinned,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fraud check score in status idle. */
export function newFraudCheckScore(code: string, name: string): FraudCheckScore {
  return new FraudCheckScore(code, name, 0, 0, false, 0, "idle");
}
