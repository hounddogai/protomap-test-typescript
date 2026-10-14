import * as text from "../../../../kit/text.js";

/** Where a batched payout batch is in its life cycle. */
export type BatchedPayoutBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched payout batch as the payout team keeps it. */
export class BatchedPayoutBatch {
  code: string;
  name: string;
  tags: string[];
  active: boolean;
  retries: number;
  cost: number;
  frequencyCap: number;
  visible: boolean;
  summary: string;
  status: BatchedPayoutBatchStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    active: boolean,
    retries: number,
    cost: number,
    frequencyCap: number,
    visible: boolean,
    summary: string,
    status: BatchedPayoutBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.active = active;
    this.retries = retries;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.visible = visible;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedPayoutBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPayoutBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched payout batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.cost + this.frequencyCap) * 100) / 100;
  }

  copy(): BatchedPayoutBatch {
    return new BatchedPayoutBatch(
      this.code,
      this.name,
      this.tags,
      this.active,
      this.retries,
      this.cost,
      this.frequencyCap,
      this.visible,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched payout batch in status planned. */
export function newBatchedPayoutBatch(code: string, name: string): BatchedPayoutBatch {
  return new BatchedPayoutBatch(code, name, [], false, 0, 0, 0, false, "", "planned");
}
