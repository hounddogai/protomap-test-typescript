import * as text from "../../../../kit/text.js";

/** Where a journey proposal is in its life cycle. */
export type JourneyProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a journey proposal and its current status. */
export class JourneyProposal {
  code: string;
  label: string;
  channel: string;
  utmSource: string;
  contactEmail: string;
  reviewer: string;
  cohort: string;
  title: string;
  description: string;
  amount: number;
  status: JourneyProposalStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    utmSource: string,
    contactEmail: string,
    reviewer: string,
    cohort: string,
    title: string,
    description: string,
    amount: number,
    status: JourneyProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.utmSource = utmSource;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.title = title;
    this.description = description;
    this.amount = amount;
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

  canMoveTo(next: JourneyProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: JourneyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"journey proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): JourneyProposal {
    return new JourneyProposal(
      this.code,
      this.label,
      this.channel,
      this.utmSource,
      this.contactEmail,
      this.reviewer,
      this.cohort,
      this.title,
      this.description,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a journey proposal in status draft. */
export function newJourneyProposal(code: string, label: string): JourneyProposal {
  return new JourneyProposal(code, label, "", "", "", "", "", "", "", 0, "draft");
}
