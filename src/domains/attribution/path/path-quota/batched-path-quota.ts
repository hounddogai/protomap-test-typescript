/**
 * The batched path quota records of attribution's path work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched path quota is in its life cycle. */
export type BatchedPathQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched path quota. Its code is unique within a tenant. */
export class BatchedPathQuota {
  code: string;
  name: string;
  title: string;
  score: number;
  tags: string[];
  status: BatchedPathQuotaStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    score: number,
    tags: string[],
    status: BatchedPathQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.score = score;
    this.tags = tags;
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

  canMoveTo(next: BatchedPathQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPathQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched path quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): BatchedPathQuota {
    return new BatchedPathQuota(this.code, this.name, this.title, this.score, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched path quota in status proposed. */
export function newBatchedPathQuota(code: string, name: string): BatchedPathQuota {
  return new BatchedPathQuota(code, name, "", 0, [], "proposed");
}
