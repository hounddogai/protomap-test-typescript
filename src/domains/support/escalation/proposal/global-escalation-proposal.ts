/**
 * The global escalation proposal records of support's escalation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global escalation proposal is in its life cycle. */
export type GlobalEscalationProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** One global escalation proposal, with what the planners need to act on it. */
export class GlobalEscalationProposal {
  code: string;
  title: string;
  graceDays: number;
  summary: string;
  windowDays: number;
  country: string;
  status: GlobalEscalationProposalStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    summary: string,
    windowDays: number,
    country: string,
    status: GlobalEscalationProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.summary = summary;
    this.windowDays = windowDays;
    this.country = country;
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

  canMoveTo(next: GlobalEscalationProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalEscalationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global escalation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global escalation proposal"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.graceDays - this.windowDays) * 100) / 100;
  }

  copy(): GlobalEscalationProposal {
    return new GlobalEscalationProposal(
      this.code,
      this.title,
      this.graceDays,
      this.summary,
      this.windowDays,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global escalation proposal in status requested. */
export function newGlobalEscalationProposal(code: string, title: string): GlobalEscalationProposal {
  return new GlobalEscalationProposal(code, title, 0, "", 0, "", "requested");
}
