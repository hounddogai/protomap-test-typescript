import * as text from "../../../../kit/text.js";

/** Where a batched reply exception is in its life cycle. */
export type BatchedReplyExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched reply exception. Its code is unique within a tenant. */
export class BatchedReplyException {
  code: string;
  name: string;
  channel: string;
  pinned: boolean;
  batchSize: number;
  ratio: number;
  region: string;
  ownerId: string;
  status: BatchedReplyExceptionStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    pinned: boolean,
    batchSize: number,
    ratio: number,
    region: string,
    ownerId: string,
    status: BatchedReplyExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.pinned = pinned;
    this.batchSize = batchSize;
    this.ratio = ratio;
    this.region = region;
    this.ownerId = ownerId;
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

  canMoveTo(next: BatchedReplyExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
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

  moveTo(next: BatchedReplyExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reply exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.ratio + this.batchSize) * 100) / 100;
  }

  copy(): BatchedReplyException {
    return new BatchedReplyException(
      this.code,
      this.name,
      this.channel,
      this.pinned,
      this.batchSize,
      this.ratio,
      this.region,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched reply exception in status proposed. */
export function newBatchedReplyException(code: string, name: string): BatchedReplyException {
  return new BatchedReplyException(code, name, "", false, 0, 0, "", "", "proposed");
}
