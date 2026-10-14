import * as text from "../../../../kit/text.js";

/** Where a lenient reply batch is in its life cycle. */
export type LenientReplyBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One lenient reply batch, with what the planners need to act on it. */
export class LenientReplyBatch {
  code: string;
  name: string;
  amount: number;
  ownerId: string;
  capacity: number;
  ratio: number;
  externalRef: string;
  status: LenientReplyBatchStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    ownerId: string,
    capacity: number,
    ratio: number,
    externalRef: string,
    status: LenientReplyBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.ratio = ratio;
    this.externalRef = externalRef;
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

  canMoveTo(next: LenientReplyBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientReplyBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reply batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient reply batch"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.capacity - this.ratio) * 100) / 100;
  }

  copy(): LenientReplyBatch {
    return new LenientReplyBatch(
      this.code,
      this.name,
      this.amount,
      this.ownerId,
      this.capacity,
      this.ratio,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient reply batch in status idle. */
export function newLenientReplyBatch(code: string, name: string): LenientReplyBatch {
  return new LenientReplyBatch(code, name, 0, "", 0, 0, "", "idle");
}
