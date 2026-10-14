import * as text from "../../../../kit/text.js";

/** Where a queue override is in its life cycle. */
export type QueueOverrideStatus = "created" | "validated" | "published" | "retired";

/** A queue override. Its code is unique within a tenant. */
export class QueueOverride {
  code: string;
  name: string;
  reviewer: string;
  ceiling: number;
  createdAt: number;
  retries: number;
  ratio: number;
  status: QueueOverrideStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    ceiling: number,
    createdAt: number,
    retries: number,
    ratio: number,
    status: QueueOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.ceiling = ceiling;
    this.createdAt = createdAt;
    this.retries = retries;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"queue override"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.createdAt + this.retries) * 100) / 100;
  }

  copy(): QueueOverride {
    return new QueueOverride(
      this.code,
      this.name,
      this.reviewer,
      this.ceiling,
      this.createdAt,
      this.retries,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a queue override in status created. */
export function newQueueOverride(code: string, name: string): QueueOverride {
  return new QueueOverride(code, name, "", 0, 0, 0, 0, "created");
}
