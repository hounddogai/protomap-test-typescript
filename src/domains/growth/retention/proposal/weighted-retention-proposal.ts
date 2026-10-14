/**
 * The weighted retention proposal records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted retention proposal is in its life cycle. */
export type WeightedRetentionProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** One weighted retention proposal, with what the planners need to act on it. */
export class WeightedRetentionProposal {
  code: string;
  label: string;
  rate: number;
  approved: boolean;
  margin: number;
  graceDays: number;
  ownerId: string;
  phone: string;
  revision: number;
  ceiling: number;
  summary: string;
  status: WeightedRetentionProposalStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    approved: boolean,
    margin: number,
    graceDays: number,
    ownerId: string,
    phone: string,
    revision: number,
    ceiling: number,
    summary: string,
    status: WeightedRetentionProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.approved = approved;
    this.margin = margin;
    this.graceDays = graceDays;
    this.ownerId = ownerId;
    this.phone = phone;
    this.revision = revision;
    this.ceiling = ceiling;
    this.summary = summary;
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

  canMoveTo(next: WeightedRetentionProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WeightedRetentionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted retention proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.graceDays + this.rate) * 100) / 100;
  }

  copy(): WeightedRetentionProposal {
    return new WeightedRetentionProposal(
      this.code,
      this.label,
      this.rate,
      this.approved,
      this.margin,
      this.graceDays,
      this.ownerId,
      this.phone,
      this.revision,
      this.ceiling,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted retention proposal in status requested. */
export function newWeightedRetentionProposal(code: string, label: string): WeightedRetentionProposal {
  return new WeightedRetentionProposal(code, label, 0, false, 0, 0, "", "", 0, 0, "", "requested");
}
