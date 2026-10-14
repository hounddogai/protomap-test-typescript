import * as text from "../../../../kit/text.js";

/** Where a batched leaderboard proposal is in its life cycle. */
export type BatchedLeaderboardProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched leaderboard proposal. Its code is unique within a tenant. */
export class BatchedLeaderboardProposal {
  code: string;
  label: string;
  ownerId: string;
  batchSize: number;
  archived: boolean;
  name: string;
  visible: boolean;
  graceDays: number;
  version: number;
  description: string;
  status: BatchedLeaderboardProposalStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    batchSize: number,
    archived: boolean,
    name: string,
    visible: boolean,
    graceDays: number,
    version: number,
    description: string,
    status: BatchedLeaderboardProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.archived = archived;
    this.name = name;
    this.visible = visible;
    this.graceDays = graceDays;
    this.version = version;
    this.description = description;
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

  canMoveTo(next: BatchedLeaderboardProposalStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedLeaderboardProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched leaderboard proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round(this.batchSize * this.graceDays * 100) / 100;
  }

  copy(): BatchedLeaderboardProposal {
    return new BatchedLeaderboardProposal(
      this.code,
      this.label,
      this.ownerId,
      this.batchSize,
      this.archived,
      this.name,
      this.visible,
      this.graceDays,
      this.version,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched leaderboard proposal in status proposed. */
export function newBatchedLeaderboardProposal(code: string, label: string): BatchedLeaderboardProposal {
  return new BatchedLeaderboardProposal(code, label, "", 0, false, "", false, 0, 0, "", "proposed");
}
