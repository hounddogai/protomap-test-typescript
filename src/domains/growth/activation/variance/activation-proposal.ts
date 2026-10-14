import * as text from "../../../../kit/text.js";

/** Where a activation proposal is in its life cycle. */
export type ActivationProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One activation proposal, with what the planners need to act on it. */
export class ActivationProposal {
  code: string;
  label: string;
  maximum: number;
  endsAt: number;
  rate: number;
  margin: number;
  ratio: number;
  revision: number;
  notes: string;
  status: ActivationProposalStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    endsAt: number,
    rate: number,
    margin: number,
    ratio: number,
    revision: number,
    notes: string,
    status: ActivationProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.endsAt = endsAt;
    this.rate = rate;
    this.margin = margin;
    this.ratio = ratio;
    this.revision = revision;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ActivationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"activation proposal"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.maximum * this.endsAt * 100) / 100;
  }

  copy(): ActivationProposal {
    return new ActivationProposal(
      this.code,
      this.label,
      this.maximum,
      this.endsAt,
      this.rate,
      this.margin,
      this.ratio,
      this.revision,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation proposal in status open. */
export function newActivationProposal(code: string, label: string): ActivationProposal {
  return new ActivationProposal(code, label, 0, 0, 0, 0, 0, 0, "", "open");
}
