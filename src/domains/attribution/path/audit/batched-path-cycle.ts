import * as text from "../../../../kit/text.js";

/** Where a batched path cycle is in its life cycle. */
export type BatchedPathCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched path cycle as the path team keeps it. */
export class BatchedPathCycle {
  code: string;
  label: string;
  active: boolean;
  attributes: Map<string, string>;
  region: string;
  cost: number;
  channel: string;
  amount: number;
  status: BatchedPathCycleStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    attributes: Map<string, string>,
    region: string,
    cost: number,
    channel: string,
    amount: number,
    status: BatchedPathCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.attributes = attributes;
    this.region = region;
    this.cost = cost;
    this.channel = channel;
    this.amount = amount;
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

  canMoveTo(next: BatchedPathCycleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedPathCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched path cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round(this.cost * this.amount * 100) / 100;
  }

  copy(): BatchedPathCycle {
    return new BatchedPathCycle(
      this.code,
      this.label,
      this.active,
      this.attributes,
      this.region,
      this.cost,
      this.channel,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched path cycle in status new. */
export function newBatchedPathCycle(code: string, label: string): BatchedPathCycle {
  return new BatchedPathCycle(code, label, false, new Map<string, string>(), "", 0, "", 0, "new");
}
