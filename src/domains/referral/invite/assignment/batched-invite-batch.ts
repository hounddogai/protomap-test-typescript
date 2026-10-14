import * as text from "../../../../kit/text.js";

/** Where a batched invite batch is in its life cycle. */
export type BatchedInviteBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** A batched invite batch as the invite team keeps it. */
export class BatchedInviteBatch {
  code: string;
  name: string;
  score: number;
  ownerId: string;
  floorValue: number;
  cost: number;
  channel: string;
  label: string;
  retries: number;
  approved: boolean;
  status: BatchedInviteBatchStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    ownerId: string,
    floorValue: number,
    cost: number,
    channel: string,
    label: string,
    retries: number,
    approved: boolean,
    status: BatchedInviteBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
    this.cost = cost;
    this.channel = channel;
    this.label = label;
    this.retries = retries;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedInviteBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedInviteBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched invite batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedVolume(): number {
    return Math.round(this.floorValue * this.retries * 100) / 100;
  }

  copy(): BatchedInviteBatch {
    return new BatchedInviteBatch(
      this.code,
      this.name,
      this.score,
      this.ownerId,
      this.floorValue,
      this.cost,
      this.channel,
      this.label,
      this.retries,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched invite batch in status requested. */
export function newBatchedInviteBatch(code: string, name: string): BatchedInviteBatch {
  return new BatchedInviteBatch(code, name, 0, "", 0, 0, "", "", 0, false, "requested");
}
