/**
 * The suppression proposal records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression proposal is in its life cycle. */
export type SuppressionProposalStatus = "new" | "queued" | "running" | "done" | "failed";

/** One suppression proposal, with what the planners need to act on it. */
export class SuppressionProposal {
  code: string;
  name: string;
  capacity: number;
  phone: string;
  channel: string;
  campaignRef: string;
  active: boolean;
  utmSource: string;
  retries: number;
  impressions: number;
  openRate: number;
  status: SuppressionProposalStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    phone: string,
    channel: string,
    campaignRef: string,
    active: boolean,
    utmSource: string,
    retries: number,
    impressions: number,
    openRate: number,
    status: SuppressionProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.phone = phone;
    this.channel = channel;
    this.campaignRef = campaignRef;
    this.active = active;
    this.utmSource = utmSource;
    this.retries = retries;
    this.impressions = impressions;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionProposalStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.openRate + this.capacity) * 100) / 100;
  }

  copy(): SuppressionProposal {
    return new SuppressionProposal(
      this.code,
      this.name,
      this.capacity,
      this.phone,
      this.channel,
      this.campaignRef,
      this.active,
      this.utmSource,
      this.retries,
      this.impressions,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a suppression proposal in status new. */
export function newSuppressionProposal(code: string, name: string): SuppressionProposal {
  return new SuppressionProposal(code, name, 0, "", "", "", false, "", 0, 0, 0, "new");
}
