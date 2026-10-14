/**
 * The sender proposal records of deliverability's sender work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender proposal is in its life cycle. */
export type SenderProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a sender proposal and its current status. */
export class SenderProposal {
  code: string;
  label: string;
  externalRef: string;
  discount: number;
  country: string;
  revision: number;
  description: string;
  margin: number;
  impressions: number;
  campaignRef: string;
  version: number;
  status: SenderProposalStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    discount: number,
    country: string,
    revision: number,
    description: string,
    margin: number,
    impressions: number,
    campaignRef: string,
    version: number,
    status: SenderProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.discount = discount;
    this.country = country;
    this.revision = revision;
    this.description = description;
    this.margin = margin;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.version = version;
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

  canMoveTo(next: SenderProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.version - this.revision) * 100) / 100;
  }

  copy(): SenderProposal {
    return new SenderProposal(
      this.code,
      this.label,
      this.externalRef,
      this.discount,
      this.country,
      this.revision,
      this.description,
      this.margin,
      this.impressions,
      this.campaignRef,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a sender proposal in status draft. */
export function newSenderProposal(code: string, label: string): SenderProposal {
  return new SenderProposal(code, label, "", 0, "", 0, "", 0, 0, "", 0, "draft");
}
