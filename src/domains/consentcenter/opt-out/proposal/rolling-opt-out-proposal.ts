/**
 * The rolling opt out proposal records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling opt out proposal is in its life cycle. */
export type RollingOptOutProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a rolling opt out proposal and its current status. */
export class RollingOptOutProposal {
  code: string;
  title: string;
  variant: string;
  segment: string;
  cost: number;
  maximum: number;
  status: RollingOptOutProposalStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    segment: string,
    cost: number,
    maximum: number,
    status: RollingOptOutProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.segment = segment;
    this.cost = cost;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingOptOutProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingOptOutProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling opt out proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling opt out proposal"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.maximum - this.cost) * 100) / 100;
  }

  copy(): RollingOptOutProposal {
    return new RollingOptOutProposal(
      this.code,
      this.title,
      this.variant,
      this.segment,
      this.cost,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling opt out proposal in status requested. */
export function newRollingOptOutProposal(code: string, title: string): RollingOptOutProposal {
  return new RollingOptOutProposal(code, title, "", "", 0, 0, "requested");
}
