import * as text from "../../../../kit/text.js";

/** Where a domain proposal is in its life cycle. */
export type DomainProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** A domain proposal. Its code is unique within a tenant. */
export class DomainProposal {
  code: string;
  title: string;
  campaignRef: string;
  threshold: number;
  pinned: boolean;
  source: string;
  timezone: string;
  windowDays: number;
  audienceId: string;
  impressions: number;
  status: DomainProposalStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    threshold: number,
    pinned: boolean,
    source: string,
    timezone: string,
    windowDays: number,
    audienceId: string,
    impressions: number,
    status: DomainProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.threshold = threshold;
    this.pinned = pinned;
    this.source = source;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
    this.impressions = impressions;
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

  canMoveTo(next: DomainProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"domain proposal"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.threshold + this.impressions) * 100) / 100;
  }

  copy(): DomainProposal {
    return new DomainProposal(
      this.code,
      this.title,
      this.campaignRef,
      this.threshold,
      this.pinned,
      this.source,
      this.timezone,
      this.windowDays,
      this.audienceId,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a domain proposal in status requested. */
export function newDomainProposal(code: string, title: string): DomainProposal {
  return new DomainProposal(code, title, "", 0, false, "", "", 0, "", 0, "requested");
}
