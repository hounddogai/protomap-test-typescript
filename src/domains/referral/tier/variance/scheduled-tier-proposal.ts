import * as text from "../../../../kit/text.js";

/** Where a scheduled tier proposal is in its life cycle. */
export type ScheduledTierProposalStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled tier proposal and its current status. */
export class ScheduledTierProposal {
  code: string;
  label: string;
  graceDays: number;
  openRate: number;
  quantity: number;
  weight: number;
  version: number;
  sequence: number;
  reviewer: string;
  segment: string;
  status: ScheduledTierProposalStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    openRate: number,
    quantity: number,
    weight: number,
    version: number,
    sequence: number,
    reviewer: string,
    segment: string,
    status: ScheduledTierProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.openRate = openRate;
    this.quantity = quantity;
    this.weight = weight;
    this.version = version;
    this.sequence = sequence;
    this.reviewer = reviewer;
    this.segment = segment;
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

  canMoveTo(next: ScheduledTierProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledTierProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled tier proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round(this.graceDays * this.quantity * 100) / 100;
  }

  copy(): ScheduledTierProposal {
    return new ScheduledTierProposal(
      this.code,
      this.label,
      this.graceDays,
      this.openRate,
      this.quantity,
      this.weight,
      this.version,
      this.sequence,
      this.reviewer,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled tier proposal in status created. */
export function newScheduledTierProposal(code: string, label: string): ScheduledTierProposal {
  return new ScheduledTierProposal(code, label, 0, 0, 0, 0, 0, 0, "", "", "created");
}
