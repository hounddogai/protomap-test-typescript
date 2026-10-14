import * as text from "../../../../kit/text.js";

/** Where a batched bounce slot is in its life cycle. */
export type BatchedBounceSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a batched bounce slot and its current status. */
export class BatchedBounceSlot {
  code: string;
  name: string;
  threshold: number;
  source: string;
  contactEmail: string;
  reviewer: string;
  quantity: number;
  version: number;
  status: BatchedBounceSlotStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    source: string,
    contactEmail: string,
    reviewer: string,
    quantity: number,
    version: number,
    status: BatchedBounceSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.source = source;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.version = version;
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

  canMoveTo(next: BatchedBounceSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BatchedBounceSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched bounce slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round((this.threshold - this.quantity) * 100) / 100;
  }

  copy(): BatchedBounceSlot {
    return new BatchedBounceSlot(
      this.code,
      this.name,
      this.threshold,
      this.source,
      this.contactEmail,
      this.reviewer,
      this.quantity,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched bounce slot in status proposed. */
export function newBatchedBounceSlot(code: string, name: string): BatchedBounceSlot {
  return new BatchedBounceSlot(code, name, 0, "", "", "", 0, 0, "proposed");
}
