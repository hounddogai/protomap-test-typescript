import * as text from "../../../../kit/text.js";

/** Where a bounce batch is in its life cycle. */
export type BounceBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A bounce batch as the bounce team keeps it. */
export class BounceBatch {
  code: string;
  name: string;
  ownerId: string;
  channel: string;
  ceiling: number;
  reviewer: string;
  status: BounceBatchStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    channel: string,
    ceiling: number,
    reviewer: string,
    status: BounceBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.channel = channel;
    this.ceiling = ceiling;
    this.reviewer = reviewer;
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

  canMoveTo(next: BounceBatchStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BounceBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): BounceBatch {
    return new BounceBatch(this.code, this.name, this.ownerId, this.channel, this.ceiling, this.reviewer, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a bounce batch in status new. */
export function newBounceBatch(code: string, name: string): BounceBatch {
  return new BounceBatch(code, name, "", "", 0, "", "new");
}
