import * as text from "../../../../kit/text.js";

/** Where a capped domain proposal is in its life cycle. */
export type CappedDomainProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped domain proposal as the domain team keeps it. */
export class CappedDomainProposal {
  code: string;
  title: string;
  channel: string;
  description: string;
  createdAt: number;
  status: CappedDomainProposalStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    description: string,
    createdAt: number,
    status: CappedDomainProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.description = description;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedDomainProposalStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CappedDomainProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped domain proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): CappedDomainProposal {
    return new CappedDomainProposal(this.code, this.title, this.channel, this.description, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped domain proposal in status proposed. */
export function newCappedDomainProposal(code: string, title: string): CappedDomainProposal {
  return new CappedDomainProposal(code, title, "", "", 0, "proposed");
}
