import * as text from "../../../../kit/text.js";

/** Where a branch record is in its life cycle. */
export type BranchRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A branch record. Its code is unique within a tenant. */
export class BranchRecord {
  code: string;
  label: string;
  score: number;
  reviewer: string;
  channel: string;
  status: BranchRecordStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    reviewer: string,
    channel: string,
    status: BranchRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.reviewer = reviewer;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BranchRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BranchRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): BranchRecord {
    return new BranchRecord(this.code, this.label, this.score, this.reviewer, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a branch record in status draft. */
export function newBranchRecord(code: string, label: string): BranchRecord {
  return new BranchRecord(code, label, 0, "", "", "draft");
}
