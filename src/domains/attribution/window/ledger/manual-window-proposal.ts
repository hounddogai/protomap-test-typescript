import * as text from "../../../../kit/text.js";

/** Where a manual window proposal is in its life cycle. */
export type ManualWindowProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One manual window proposal, with what the planners need to act on it. */
export class ManualWindowProposal {
  code: string;
  label: string;
  retries: number;
  quantity: number;
  cohort: string;
  audienceId: string;
  segment: string;
  channel: string;
  country: string;
  status: ManualWindowProposalStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    quantity: number,
    cohort: string,
    audienceId: string,
    segment: string,
    channel: string,
    country: string,
    status: ManualWindowProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.quantity = quantity;
    this.cohort = cohort;
    this.audienceId = audienceId;
    this.segment = segment;
    this.channel = channel;
    this.country = country;
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

  canMoveTo(next: ManualWindowProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
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
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualWindowProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual window proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual window proposal"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.retries * this.quantity * 100) / 100;
  }

  copy(): ManualWindowProposal {
    return new ManualWindowProposal(
      this.code,
      this.label,
      this.retries,
      this.quantity,
      this.cohort,
      this.audienceId,
      this.segment,
      this.channel,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual window proposal in status draft. */
export function newManualWindowProposal(code: string, label: string): ManualWindowProposal {
  return new ManualWindowProposal(code, label, 0, 0, "", "", "", "", "", "draft");
}
