import * as text from "../../../../kit/text.js";

/** Where a batched pacing proposal is in its life cycle. */
export type BatchedPacingProposalStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a batched pacing proposal and its current status. */
export class BatchedPacingProposal {
  code: string;
  title: string;
  weight: number;
  conversionRate: number;
  utmSource: string;
  active: boolean;
  status: BatchedPacingProposalStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    conversionRate: number,
    utmSource: string,
    active: boolean,
    status: BatchedPacingProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.conversionRate = conversionRate;
    this.utmSource = utmSource;
    this.active = active;
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

  canMoveTo(next: BatchedPacingProposalStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
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

  moveTo(next: BatchedPacingProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched pacing proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedTotal(): number {
    return Math.round((this.conversionRate + this.weight) * 100) / 100;
  }

  copy(): BatchedPacingProposal {
    return new BatchedPacingProposal(
      this.code,
      this.title,
      this.weight,
      this.conversionRate,
      this.utmSource,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched pacing proposal in status new. */
export function newBatchedPacingProposal(code: string, title: string): BatchedPacingProposal {
  return new BatchedPacingProposal(code, title, 0, 0, "", false, "new");
}
