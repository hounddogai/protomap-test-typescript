import * as text from "../../../../kit/text.js";

/** Where a strict path proposal is in its life cycle. */
export type StrictPathProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a strict path proposal and its current status. */
export class StrictPathProposal {
  code: string;
  title: string;
  budget: number;
  ownerId: string;
  rate: number;
  openRate: number;
  batchSize: number;
  ceiling: number;
  audienceId: string;
  channel: string;
  description: string;
  status: StrictPathProposalStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    ownerId: string,
    rate: number,
    openRate: number,
    batchSize: number,
    ceiling: number,
    audienceId: string,
    channel: string,
    description: string,
    status: StrictPathProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.ownerId = ownerId;
    this.rate = rate;
    this.openRate = openRate;
    this.batchSize = batchSize;
    this.ceiling = ceiling;
    this.audienceId = audienceId;
    this.channel = channel;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPathProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPathProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict path proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round((this.budget + this.openRate) * 100) / 100;
  }

  copy(): StrictPathProposal {
    return new StrictPathProposal(
      this.code,
      this.title,
      this.budget,
      this.ownerId,
      this.rate,
      this.openRate,
      this.batchSize,
      this.ceiling,
      this.audienceId,
      this.channel,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict path proposal in status idle. */
export function newStrictPathProposal(code: string, title: string): StrictPathProposal {
  return new StrictPathProposal(code, title, 0, "", 0, 0, 0, 0, "", "", "", "idle");
}
