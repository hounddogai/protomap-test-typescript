import * as text from "../../../../kit/text.js";

/** Where a activation threshold is in its life cycle. */
export type ActivationThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A activation threshold as the activation team keeps it. */
export class ActivationThreshold {
  code: string;
  label: string;
  minimum: number;
  graceDays: number;
  discount: number;
  startsAt: number;
  status: ActivationThresholdStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    graceDays: number,
    discount: number,
    startsAt: number,
    status: ActivationThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.graceDays = graceDays;
    this.discount = discount;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"activation threshold"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.graceDays * this.minimum * 100) / 100;
  }

  copy(): ActivationThreshold {
    return new ActivationThreshold(
      this.code,
      this.label,
      this.minimum,
      this.graceDays,
      this.discount,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation threshold in status open. */
export function newActivationThreshold(code: string, label: string): ActivationThreshold {
  return new ActivationThreshold(code, label, 0, 0, 0, 0, "open");
}
