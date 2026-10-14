import * as text from "../../../../kit/text.js";

/** Where a batched branch assignment is in its life cycle. */
export type BatchedBranchAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched branch assignment and its current status. */
export class BatchedBranchAssignment {
  code: string;
  label: string;
  archived: boolean;
  description: string;
  tags: string[];
  graceDays: number;
  name: string;
  budget: number;
  status: BatchedBranchAssignmentStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    description: string,
    tags: string[],
    graceDays: number,
    name: string,
    budget: number,
    status: BatchedBranchAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.description = description;
    this.tags = tags;
    this.graceDays = graceDays;
    this.name = name;
    this.budget = budget;
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

  canMoveTo(next: BatchedBranchAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: BatchedBranchAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched branch assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched branch assignment"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.graceDays + this.budget) * 100) / 100;
  }

  copy(): BatchedBranchAssignment {
    return new BatchedBranchAssignment(
      this.code,
      this.label,
      this.archived,
      this.description,
      this.tags,
      this.graceDays,
      this.name,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched branch assignment in status requested. */
export function newBatchedBranchAssignment(code: string, label: string): BatchedBranchAssignment {
  return new BatchedBranchAssignment(code, label, false, "", [], 0, "", 0, "requested");
}
