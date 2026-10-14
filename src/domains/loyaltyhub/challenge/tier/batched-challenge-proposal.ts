import * as text from "../../../../kit/text.js";

/** Where a batched challenge proposal is in its life cycle. */
export type BatchedChallengeProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched challenge proposal as the challenge team keeps it. */
export class BatchedChallengeProposal {
  code: string;
  label: string;
  source: string;
  priority: number;
  threshold: number;
  openRate: number;
  status: BatchedChallengeProposalStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    priority: number,
    threshold: number,
    openRate: number,
    status: BatchedChallengeProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.priority = priority;
    this.threshold = threshold;
    this.openRate = openRate;
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

  canMoveTo(next: BatchedChallengeProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
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

  moveTo(next: BatchedChallengeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched challenge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.priority - this.openRate) * 100) / 100;
  }

  copy(): BatchedChallengeProposal {
    return new BatchedChallengeProposal(
      this.code,
      this.label,
      this.source,
      this.priority,
      this.threshold,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched challenge proposal in status draft. */
export function newBatchedChallengeProposal(code: string, label: string): BatchedChallengeProposal {
  return new BatchedChallengeProposal(code, label, "", 0, 0, 0, "draft");
}
