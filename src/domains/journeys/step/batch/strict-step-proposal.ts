import * as text from "../../../../kit/text.js";

/** Where a strict step proposal is in its life cycle. */
export type StrictStepProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a strict step proposal and its current status. */
export class StrictStepProposal {
  code: string;
  title: string;
  attempts: number;
  timezone: string;
  pinned: boolean;
  revision: number;
  score: number;
  bid: number;
  discount: number;
  variant: string;
  updatedAt: number;
  status: StrictStepProposalStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    timezone: string,
    pinned: boolean,
    revision: number,
    score: number,
    bid: number,
    discount: number,
    variant: string,
    updatedAt: number,
    status: StrictStepProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.timezone = timezone;
    this.pinned = pinned;
    this.revision = revision;
    this.score = score;
    this.bid = bid;
    this.discount = discount;
    this.variant = variant;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: StrictStepProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictStepProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict step proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.score + this.discount) * 100) / 100;
  }

  copy(): StrictStepProposal {
    return new StrictStepProposal(
      this.code,
      this.title,
      this.attempts,
      this.timezone,
      this.pinned,
      this.revision,
      this.score,
      this.bid,
      this.discount,
      this.variant,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict step proposal in status requested. */
export function newStrictStepProposal(code: string, title: string): StrictStepProposal {
  return new StrictStepProposal(code, title, 0, "", false, 0, 0, 0, 0, "", 0, "requested");
}
