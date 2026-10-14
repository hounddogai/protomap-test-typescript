import * as text from "../../../../kit/text.js";

/** Where a lenient queue proposal is in its life cycle. */
export type LenientQueueProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a lenient queue proposal and its current status. */
export class LenientQueueProposal {
  code: string;
  name: string;
  channel: string;
  sequence: number;
  archived: boolean;
  status: LenientQueueProposalStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    sequence: number,
    archived: boolean,
    status: LenientQueueProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.sequence = sequence;
    this.archived = archived;
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

  canMoveTo(next: LenientQueueProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
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

  moveTo(next: LenientQueueProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient queue proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient queue proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): LenientQueueProposal {
    return new LenientQueueProposal(this.code, this.name, this.channel, this.sequence, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient queue proposal in status draft. */
export function newLenientQueueProposal(code: string, name: string): LenientQueueProposal {
  return new LenientQueueProposal(code, name, "", 0, false, "draft");
}
