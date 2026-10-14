import * as text from "../../../../kit/text.js";

/** Where a weighted proof assignment is in its life cycle. */
export type WeightedProofAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted proof assignment, with what the planners need to act on it. */
export class WeightedProofAssignment {
  code: string;
  name: string;
  expiresAt: number;
  budget: number;
  threshold: number;
  externalRef: string;
  source: string;
  status: WeightedProofAssignmentStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    budget: number,
    threshold: number,
    externalRef: string,
    source: string,
    status: WeightedProofAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.source = source;
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

  canMoveTo(next: WeightedProofAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedProofAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted proof assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted proof assignment"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.threshold + this.expiresAt) * 100) / 100;
  }

  copy(): WeightedProofAssignment {
    return new WeightedProofAssignment(
      this.code,
      this.name,
      this.expiresAt,
      this.budget,
      this.threshold,
      this.externalRef,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted proof assignment in status new. */
export function newWeightedProofAssignment(code: string, name: string): WeightedProofAssignment {
  return new WeightedProofAssignment(code, name, 0, 0, 0, "", "", "new");
}
