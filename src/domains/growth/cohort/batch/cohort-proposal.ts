import * as text from "../../../../kit/text.js";

/** Where a cohort proposal is in its life cycle. */
export type CohortProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One cohort proposal, with what the planners need to act on it. */
export class CohortProposal {
  code: string;
  title: string;
  visible: boolean;
  country: string;
  source: string;
  contactEmail: string;
  batchSize: number;
  currency: string;
  status: CohortProposalStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    country: string,
    source: string,
    contactEmail: string,
    batchSize: number,
    currency: string,
    status: CohortProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.country = country;
    this.source = source;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.currency = currency;
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

  canMoveTo(next: CohortProposalStatus): boolean {
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
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"cohort proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): CohortProposal {
    return new CohortProposal(
      this.code,
      this.title,
      this.visible,
      this.country,
      this.source,
      this.contactEmail,
      this.batchSize,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a cohort proposal in status proposed. */
export function newCohortProposal(code: string, title: string): CohortProposal {
  return new CohortProposal(code, title, false, "", "", "", 0, "", "proposed");
}
