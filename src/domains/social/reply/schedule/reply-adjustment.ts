import * as text from "../../../../kit/text.js";

/** Where a reply adjustment is in its life cycle. */
export type ReplyAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a reply adjustment and its current status. */
export class ReplyAdjustment {
  code: string;
  name: string;
  batchSize: number;
  externalRef: string;
  startsAt: number;
  limit: number;
  title: string;
  status: ReplyAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    externalRef: string,
    startsAt: number,
    limit: number,
    title: string,
    status: ReplyAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.externalRef = externalRef;
    this.startsAt = startsAt;
    this.limit = limit;
    this.title = title;
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

  canMoveTo(next: ReplyAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.startsAt + this.batchSize) * 100) / 100;
  }

  copy(): ReplyAdjustment {
    return new ReplyAdjustment(
      this.code,
      this.name,
      this.batchSize,
      this.externalRef,
      this.startsAt,
      this.limit,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reply adjustment in status idle. */
export function newReplyAdjustment(code: string, name: string): ReplyAdjustment {
  return new ReplyAdjustment(code, name, 0, "", 0, 0, "", "idle");
}
