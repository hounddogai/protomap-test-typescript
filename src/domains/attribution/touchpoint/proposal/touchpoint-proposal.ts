/**
 * The touchpoint proposal records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint proposal is in its life cycle. */
export type TouchpointProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A touchpoint proposal. Its code is unique within a tenant. */
export class TouchpointProposal {
  code: string;
  name: string;
  bid: number;
  channel: string;
  category: string;
  approved: boolean;
  batchSize: number;
  budget: number;
  impressions: number;
  status: TouchpointProposalStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    channel: string,
    category: string,
    approved: boolean,
    batchSize: number,
    budget: number,
    impressions: number,
    status: TouchpointProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.channel = channel;
    this.category = category;
    this.approved = approved;
    this.batchSize = batchSize;
    this.budget = budget;
    this.impressions = impressions;
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

  canMoveTo(next: TouchpointProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.batchSize * this.bid * 100) / 100;
  }

  copy(): TouchpointProposal {
    return new TouchpointProposal(
      this.code,
      this.name,
      this.bid,
      this.channel,
      this.category,
      this.approved,
      this.batchSize,
      this.budget,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a touchpoint proposal in status idle. */
export function newTouchpointProposal(code: string, name: string): TouchpointProposal {
  return new TouchpointProposal(code, name, 0, "", "", false, 0, 0, 0, "idle");
}
