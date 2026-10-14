import * as text from "../../../../kit/text.js";

/** Where a bounce exception is in its life cycle. */
export type BounceExceptionStatus = "created" | "validated" | "published" | "retired";

/** A bounce exception as the bounce team keeps it. */
export class BounceException {
  code: string;
  label: string;
  priority: number;
  windowDays: number;
  cost: number;
  status: BounceExceptionStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    windowDays: number,
    cost: number,
    status: BounceExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.windowDays = windowDays;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.priority + this.cost) * 100) / 100;
  }

  copy(): BounceException {
    return new BounceException(this.code, this.label, this.priority, this.windowDays, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bounce exception in status created. */
export function newBounceException(code: string, label: string): BounceException {
  return new BounceException(code, label, 0, 0, 0, "created");
}
