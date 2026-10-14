/**
 * The lenient funnel proposal records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient funnel proposal is in its life cycle. */
export type LenientFunnelProposalStatus = "created" | "validated" | "published" | "retired";

/** One lenient funnel proposal, with what the planners need to act on it. */
export class LenientFunnelProposal {
  code: string;
  label: string;
  approved: boolean;
  utmSource: string;
  channel: string;
  externalRef: string;
  score: number;
  status: LenientFunnelProposalStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    utmSource: string,
    channel: string,
    externalRef: string,
    score: number,
    status: LenientFunnelProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.utmSource = utmSource;
    this.channel = channel;
    this.externalRef = externalRef;
    this.score = score;
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

  canMoveTo(next: LenientFunnelProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: LenientFunnelProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient funnel proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient funnel proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): LenientFunnelProposal {
    return new LenientFunnelProposal(
      this.code,
      this.label,
      this.approved,
      this.utmSource,
      this.channel,
      this.externalRef,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient funnel proposal in status created. */
export function newLenientFunnelProposal(code: string, label: string): LenientFunnelProposal {
  return new LenientFunnelProposal(code, label, false, "", "", "", 0, "created");
}
