import * as text from "../../../../kit/text.js";

/** Where a sla proposal is in its life cycle. */
export type SlaProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a sla proposal and its current status. */
export class SlaProposal {
  code: string;
  name: string;
  externalRef: string;
  contactEmail: string;
  windowDays: number;
  locale: string;
  summary: string;
  ownerId: string;
  createdAt: number;
  region: string;
  pinned: boolean;
  status: SlaProposalStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    contactEmail: string,
    windowDays: number,
    locale: string,
    summary: string,
    ownerId: string,
    createdAt: number,
    region: string,
    pinned: boolean,
    status: SlaProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.contactEmail = contactEmail;
    this.windowDays = windowDays;
    this.locale = locale;
    this.summary = summary;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.region = region;
    this.pinned = pinned;
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

  canMoveTo(next: SlaProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SlaProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.createdAt - this.windowDays) * 100) / 100;
  }

  copy(): SlaProposal {
    return new SlaProposal(
      this.code,
      this.name,
      this.externalRef,
      this.contactEmail,
      this.windowDays,
      this.locale,
      this.summary,
      this.ownerId,
      this.createdAt,
      this.region,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a sla proposal in status requested. */
export function newSlaProposal(code: string, name: string): SlaProposal {
  return new SlaProposal(code, name, "", "", 0, "", "", "", 0, "", false, "requested");
}
