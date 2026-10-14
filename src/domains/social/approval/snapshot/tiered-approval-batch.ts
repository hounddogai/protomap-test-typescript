import * as text from "../../../../kit/text.js";

/** Where a tiered approval batch is in its life cycle. */
export type TieredApprovalBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a tiered approval batch and its current status. */
export class TieredApprovalBatch {
  code: string;
  name: string;
  notes: string;
  discount: number;
  bid: number;
  summary: string;
  retries: number;
  pinned: boolean;
  status: TieredApprovalBatchStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    discount: number,
    bid: number,
    summary: string,
    retries: number,
    pinned: boolean,
    status: TieredApprovalBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.discount = discount;
    this.bid = bid;
    this.summary = summary;
    this.retries = retries;
    this.pinned = pinned;
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

  canMoveTo(next: TieredApprovalBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
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
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredApprovalBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered approval batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.bid * this.discount * 100) / 100;
  }

  copy(): TieredApprovalBatch {
    return new TieredApprovalBatch(
      this.code,
      this.name,
      this.notes,
      this.discount,
      this.bid,
      this.summary,
      this.retries,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered approval batch in status planned. */
export function newTieredApprovalBatch(code: string, name: string): TieredApprovalBatch {
  return new TieredApprovalBatch(code, name, "", 0, 0, "", 0, false, "planned");
}
