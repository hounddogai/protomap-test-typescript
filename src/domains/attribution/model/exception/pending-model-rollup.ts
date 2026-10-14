import * as text from "../../../../kit/text.js";

/** Where a pending model rollup is in its life cycle. */
export type PendingModelRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending model rollup as the model team keeps it. */
export class PendingModelRollup {
  code: string;
  label: string;
  conversionRate: number;
  budget: number;
  channel: string;
  graceDays: number;
  variant: string;
  status: PendingModelRollupStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    budget: number,
    channel: string,
    graceDays: number,
    variant: string,
    status: PendingModelRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.budget = budget;
    this.channel = channel;
    this.graceDays = graceDays;
    this.variant = variant;
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

  canMoveTo(next: PendingModelRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingModelRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending model rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedValue(): number {
    return Math.round(this.graceDays * this.conversionRate * 100) / 100;
  }

  copy(): PendingModelRollup {
    return new PendingModelRollup(
      this.code,
      this.label,
      this.conversionRate,
      this.budget,
      this.channel,
      this.graceDays,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending model rollup in status proposed. */
export function newPendingModelRollup(code: string, label: string): PendingModelRollup {
  return new PendingModelRollup(code, label, 0, 0, "", 0, "", "proposed");
}
