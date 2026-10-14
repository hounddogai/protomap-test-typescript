import * as text from "../../../../kit/text.js";

/** Where a reward batch is in its life cycle. */
export type RewardBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reward batch, with what the planners need to act on it. */
export class RewardBatch {
  code: string;
  name: string;
  notes: string;
  variant: string;
  audienceId: string;
  externalRef: string;
  frequencyCap: number;
  amount: number;
  bid: number;
  status: RewardBatchStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    variant: string,
    audienceId: string,
    externalRef: string,
    frequencyCap: number,
    amount: number,
    bid: number,
    status: RewardBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.variant = variant;
    this.audienceId = audienceId;
    this.externalRef = externalRef;
    this.frequencyCap = frequencyCap;
    this.amount = amount;
    this.bid = bid;
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

  canMoveTo(next: RewardBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: RewardBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round(this.amount * this.frequencyCap * 100) / 100;
  }

  copy(): RewardBatch {
    return new RewardBatch(
      this.code,
      this.name,
      this.notes,
      this.variant,
      this.audienceId,
      this.externalRef,
      this.frequencyCap,
      this.amount,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward batch in status proposed. */
export function newRewardBatch(code: string, name: string): RewardBatch {
  return new RewardBatch(code, name, "", "", "", "", 0, 0, 0, "proposed");
}
