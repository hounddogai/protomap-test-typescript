import * as text from "../../../../kit/text.js";

/** Where a adaptive warmup budget is in its life cycle. */
export type AdaptiveWarmupBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive warmup budget. Its code is unique within a tenant. */
export class AdaptiveWarmupBudget {
  code: string;
  label: string;
  cost: number;
  batchSize: number;
  channel: string;
  reviewer: string;
  sequence: number;
  contactEmail: string;
  amount: number;
  floorValue: number;
  status: AdaptiveWarmupBudgetStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    batchSize: number,
    channel: string,
    reviewer: string,
    sequence: number,
    contactEmail: string,
    amount: number,
    floorValue: number,
    status: AdaptiveWarmupBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.batchSize = batchSize;
    this.channel = channel;
    this.reviewer = reviewer;
    this.sequence = sequence;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.floorValue = floorValue;
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

  canMoveTo(next: AdaptiveWarmupBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveWarmupBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive warmup budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive warmup budget"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.batchSize + this.floorValue) * 100) / 100;
  }

  copy(): AdaptiveWarmupBudget {
    return new AdaptiveWarmupBudget(
      this.code,
      this.label,
      this.cost,
      this.batchSize,
      this.channel,
      this.reviewer,
      this.sequence,
      this.contactEmail,
      this.amount,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive warmup budget in status new. */
export function newAdaptiveWarmupBudget(code: string, label: string): AdaptiveWarmupBudget {
  return new AdaptiveWarmupBudget(code, label, 0, 0, "", "", 0, "", 0, 0, "new");
}
