import * as text from "../../../../kit/text.js";

/** Where a badge proposal is in its life cycle. */
export type BadgeProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a badge proposal and its current status. */
export class BadgeProposal {
  code: string;
  title: string;
  createdAt: number;
  endsAt: number;
  source: string;
  attempts: number;
  status: BadgeProposalStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    endsAt: number,
    source: string,
    attempts: number,
    status: BadgeProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.endsAt = endsAt;
    this.source = source;
    this.attempts = attempts;
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

  canMoveTo(next: BadgeProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: BadgeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round(this.attempts * this.createdAt * 100) / 100;
  }

  copy(): BadgeProposal {
    return new BadgeProposal(
      this.code,
      this.title,
      this.createdAt,
      this.endsAt,
      this.source,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a badge proposal in status draft. */
export function newBadgeProposal(code: string, title: string): BadgeProposal {
  return new BadgeProposal(code, title, 0, 0, "", 0, "draft");
}
