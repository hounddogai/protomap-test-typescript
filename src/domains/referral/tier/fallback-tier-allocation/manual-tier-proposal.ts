import * as text from "../../../../kit/text.js";

/** Where a manual tier proposal is in its life cycle. */
export type ManualTierProposalStatus = "created" | "validated" | "published" | "retired";

/** A manual tier proposal as the tier team keeps it. */
export class ManualTierProposal {
  code: string;
  title: string;
  createdAt: number;
  graceDays: number;
  sendAt: number;
  status: ManualTierProposalStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    graceDays: number,
    sendAt: number,
    status: ManualTierProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
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

  canMoveTo(next: ManualTierProposalStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualTierProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.sendAt + this.graceDays) * 100) / 100;
  }

  copy(): ManualTierProposal {
    return new ManualTierProposal(this.code, this.title, this.createdAt, this.graceDays, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual tier proposal in status created. */
export function newManualTierProposal(code: string, title: string): ManualTierProposal {
  return new ManualTierProposal(code, title, 0, 0, 0, "created");
}
