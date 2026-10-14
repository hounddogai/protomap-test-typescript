/**
 * The capped suppression proposal records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped suppression proposal is in its life cycle. */
export type CappedSuppressionProposalStatus = "created" | "validated" | "published" | "retired";

/** One capped suppression proposal, with what the planners need to act on it. */
export class CappedSuppressionProposal {
  code: string;
  label: string;
  minimum: number;
  bid: number;
  ceiling: number;
  ownerId: string;
  region: string;
  audienceId: string;
  quantity: number;
  clicks: number;
  status: CappedSuppressionProposalStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    bid: number,
    ceiling: number,
    ownerId: string,
    region: string,
    audienceId: string,
    quantity: number,
    clicks: number,
    status: CappedSuppressionProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.bid = bid;
    this.ceiling = ceiling;
    this.ownerId = ownerId;
    this.region = region;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.clicks = clicks;
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

  canMoveTo(next: CappedSuppressionProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedSuppressionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped suppression proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedExposure(): number {
    return Math.round((this.minimum + this.ceiling) * 100) / 100;
  }

  copy(): CappedSuppressionProposal {
    return new CappedSuppressionProposal(
      this.code,
      this.label,
      this.minimum,
      this.bid,
      this.ceiling,
      this.ownerId,
      this.region,
      this.audienceId,
      this.quantity,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped suppression proposal in status created. */
export function newCappedSuppressionProposal(code: string, label: string): CappedSuppressionProposal {
  return new CappedSuppressionProposal(code, label, 0, 0, 0, "", "", "", 0, 0, "created");
}
