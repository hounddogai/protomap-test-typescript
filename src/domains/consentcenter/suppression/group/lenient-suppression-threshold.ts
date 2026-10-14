import * as text from "../../../../kit/text.js";

/** Where a lenient suppression threshold is in its life cycle. */
export type LenientSuppressionThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient suppression threshold and its current status. */
export class LenientSuppressionThreshold {
  code: string;
  name: string;
  category: string;
  budget: number;
  segment: string;
  status: LenientSuppressionThresholdStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    budget: number,
    segment: string,
    status: LenientSuppressionThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.budget = budget;
    this.segment = segment;
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

  canMoveTo(next: LenientSuppressionThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: LenientSuppressionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient suppression threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient suppression threshold"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): LenientSuppressionThreshold {
    return new LenientSuppressionThreshold(this.code, this.name, this.category, this.budget, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient suppression threshold in status idle. */
export function newLenientSuppressionThreshold(code: string, name: string): LenientSuppressionThreshold {
  return new LenientSuppressionThreshold(code, name, "", 0, "", "idle");
}
