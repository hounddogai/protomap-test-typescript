import * as text from "../../../../kit/text.js";

/** Where a step proposal is in its life cycle. */
export type StepProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A step proposal. Its code is unique within a tenant. */
export class StepProposal {
  code: string;
  title: string;
  maximum: number;
  score: number;
  rate: number;
  reviewer: string;
  locale: string;
  margin: number;
  status: StepProposalStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    score: number,
    rate: number,
    reviewer: string,
    locale: string,
    margin: number,
    status: StepProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.score = score;
    this.rate = rate;
    this.reviewer = reviewer;
    this.locale = locale;
    this.margin = margin;
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

  canMoveTo(next: StepProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StepProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.score - this.margin) * 100) / 100;
  }

  copy(): StepProposal {
    return new StepProposal(
      this.code,
      this.title,
      this.maximum,
      this.score,
      this.rate,
      this.reviewer,
      this.locale,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a step proposal in status draft. */
export function newStepProposal(code: string, title: string): StepProposal {
  return new StepProposal(code, title, 0, 0, 0, "", "", 0, "draft");
}
