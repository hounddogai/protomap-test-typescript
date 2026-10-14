import * as text from "../../../../kit/text.js";

/** Where a pending frequency proposal is in its life cycle. */
export type PendingFrequencyProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending frequency proposal as the frequency team keeps it. */
export class PendingFrequencyProposal {
  code: string;
  name: string;
  summary: string;
  floorValue: number;
  ceiling: number;
  sendAt: number;
  rate: number;
  budget: number;
  channel: string;
  minimum: number;
  status: PendingFrequencyProposalStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    floorValue: number,
    ceiling: number,
    sendAt: number,
    rate: number,
    budget: number,
    channel: string,
    minimum: number,
    status: PendingFrequencyProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.floorValue = floorValue;
    this.ceiling = ceiling;
    this.sendAt = sendAt;
    this.rate = rate;
    this.budget = budget;
    this.channel = channel;
    this.minimum = minimum;
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

  canMoveTo(next: PendingFrequencyProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "closed";
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

  moveTo(next: PendingFrequencyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending frequency proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.floorValue - this.budget) * 100) / 100;
  }

  copy(): PendingFrequencyProposal {
    return new PendingFrequencyProposal(
      this.code,
      this.name,
      this.summary,
      this.floorValue,
      this.ceiling,
      this.sendAt,
      this.rate,
      this.budget,
      this.channel,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending frequency proposal in status draft. */
export function newPendingFrequencyProposal(code: string, name: string): PendingFrequencyProposal {
  return new PendingFrequencyProposal(code, name, "", 0, 0, 0, 0, 0, "", 0, "draft");
}
