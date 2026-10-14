import * as text from "../../../../kit/text.js";

/** Where a batched creative group is in its life cycle. */
export type BatchedCreativeGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched creative group, with what the planners need to act on it. */
export class BatchedCreativeGroup {
  code: string;
  title: string;
  contactEmail: string;
  checksum: string;
  retries: number;
  floorValue: number;
  status: BatchedCreativeGroupStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    checksum: string,
    retries: number,
    floorValue: number,
    status: BatchedCreativeGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.retries = retries;
    this.floorValue = floorValue;
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

  canMoveTo(next: BatchedCreativeGroupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedCreativeGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched creative group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched creative group"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.retries - this.floorValue) * 100) / 100;
  }

  copy(): BatchedCreativeGroup {
    return new BatchedCreativeGroup(
      this.code,
      this.title,
      this.contactEmail,
      this.checksum,
      this.retries,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched creative group in status new. */
export function newBatchedCreativeGroup(code: string, title: string): BatchedCreativeGroup {
  return new BatchedCreativeGroup(code, title, "", "", 0, 0, "new");
}
