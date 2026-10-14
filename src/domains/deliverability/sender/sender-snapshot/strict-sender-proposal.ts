import * as text from "../../../../kit/text.js";

/** Where a strict sender proposal is in its life cycle. */
export type StrictSenderProposalStatus = "created" | "validated" | "published" | "retired";

/** One strict sender proposal, with what the planners need to act on it. */
export class StrictSenderProposal {
  code: string;
  name: string;
  retries: number;
  createdAt: number;
  contactEmail: string;
  amount: number;
  status: StrictSenderProposalStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    createdAt: number,
    contactEmail: string,
    amount: number,
    status: StrictSenderProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.amount = amount;
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

  canMoveTo(next: StrictSenderProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictSenderProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict sender proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round(this.retries * this.amount * 100) / 100;
  }

  copy(): StrictSenderProposal {
    return new StrictSenderProposal(
      this.code,
      this.name,
      this.retries,
      this.createdAt,
      this.contactEmail,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict sender proposal in status created. */
export function newStrictSenderProposal(code: string, name: string): StrictSenderProposal {
  return new StrictSenderProposal(code, name, 0, 0, "", 0, "created");
}
