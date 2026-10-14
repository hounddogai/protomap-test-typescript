import * as text from "../../../../kit/text.js";

/** Where a rolling sla threshold is in its life cycle. */
export type RollingSlaThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling sla threshold as the sla team keeps it. */
export class RollingSlaThreshold {
  code: string;
  title: string;
  category: string;
  variant: string;
  createdAt: number;
  journeyId: string;
  amount: number;
  status: RollingSlaThresholdStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    variant: string,
    createdAt: number,
    journeyId: string,
    amount: number,
    status: RollingSlaThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.variant = variant;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.amount = amount;
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

  canMoveTo(next: RollingSlaThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: RollingSlaThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling sla threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round(this.createdAt * this.amount * 100) / 100;
  }

  copy(): RollingSlaThreshold {
    return new RollingSlaThreshold(
      this.code,
      this.title,
      this.category,
      this.variant,
      this.createdAt,
      this.journeyId,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling sla threshold in status idle. */
export function newRollingSlaThreshold(code: string, title: string): RollingSlaThreshold {
  return new RollingSlaThreshold(code, title, "", "", 0, "", 0, "idle");
}
