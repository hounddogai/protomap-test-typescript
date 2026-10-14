/**
 * The primary domain proposal records of deliverability's domain work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary domain proposal is in its life cycle. */
export type PrimaryDomainProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary domain proposal. Its code is unique within a tenant. */
export class PrimaryDomainProposal {
  code: string;
  label: string;
  clicks: number;
  graceDays: number;
  bid: number;
  endsAt: number;
  conversionRate: number;
  externalRef: string;
  status: PrimaryDomainProposalStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    graceDays: number,
    bid: number,
    endsAt: number,
    conversionRate: number,
    externalRef: string,
    status: PrimaryDomainProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.graceDays = graceDays;
    this.bid = bid;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
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

  canMoveTo(next: PrimaryDomainProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryDomainProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary domain proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round(this.bid * this.clicks * 100) / 100;
  }

  copy(): PrimaryDomainProposal {
    return new PrimaryDomainProposal(
      this.code,
      this.label,
      this.clicks,
      this.graceDays,
      this.bid,
      this.endsAt,
      this.conversionRate,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary domain proposal in status requested. */
export function newPrimaryDomainProposal(code: string, label: string): PrimaryDomainProposal {
  return new PrimaryDomainProposal(code, label, 0, 0, 0, 0, 0, "", "requested");
}
