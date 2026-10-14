import * as text from "../../../../kit/text.js";

/** Where a redemption proposal is in its life cycle. */
export type RedemptionProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a redemption proposal and its current status. */
export class RedemptionProposal {
  code: string;
  label: string;
  bid: number;
  cost: number;
  journeyId: string;
  name: string;
  revision: number;
  active: boolean;
  priority: number;
  endsAt: number;
  discount: number;
  status: RedemptionProposalStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    cost: number,
    journeyId: string,
    name: string,
    revision: number,
    active: boolean,
    priority: number,
    endsAt: number,
    discount: number,
    status: RedemptionProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.cost = cost;
    this.journeyId = journeyId;
    this.name = name;
    this.revision = revision;
    this.active = active;
    this.priority = priority;
    this.endsAt = endsAt;
    this.discount = discount;
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

  canMoveTo(next: RedemptionProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RedemptionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedValue(): number {
    return Math.round(this.bid * this.cost * 100) / 100;
  }

  copy(): RedemptionProposal {
    return new RedemptionProposal(
      this.code,
      this.label,
      this.bid,
      this.cost,
      this.journeyId,
      this.name,
      this.revision,
      this.active,
      this.priority,
      this.endsAt,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption proposal in status idle. */
export function newRedemptionProposal(code: string, label: string): RedemptionProposal {
  return new RedemptionProposal(code, label, 0, 0, "", "", 0, false, 0, 0, 0, "idle");
}
