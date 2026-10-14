import * as text from "../../../../kit/text.js";

/** Where a adaptive complaint proposal is in its life cycle. */
export type AdaptiveComplaintProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One adaptive complaint proposal, with what the planners need to act on it. */
export class AdaptiveComplaintProposal {
  code: string;
  label: string;
  budget: number;
  locale: string;
  graceDays: number;
  pinned: boolean;
  tags: string[];
  archived: boolean;
  cost: number;
  reviewer: string;
  status: AdaptiveComplaintProposalStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    locale: string,
    graceDays: number,
    pinned: boolean,
    tags: string[],
    archived: boolean,
    cost: number,
    reviewer: string,
    status: AdaptiveComplaintProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.locale = locale;
    this.graceDays = graceDays;
    this.pinned = pinned;
    this.tags = tags;
    this.archived = archived;
    this.cost = cost;
    this.reviewer = reviewer;
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

  canMoveTo(next: AdaptiveComplaintProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveComplaintProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive complaint proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round(this.budget * this.graceDays * 100) / 100;
  }

  copy(): AdaptiveComplaintProposal {
    return new AdaptiveComplaintProposal(
      this.code,
      this.label,
      this.budget,
      this.locale,
      this.graceDays,
      this.pinned,
      this.tags,
      this.archived,
      this.cost,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive complaint proposal in status draft. */
export function newAdaptiveComplaintProposal(code: string, label: string): AdaptiveComplaintProposal {
  return new AdaptiveComplaintProposal(code, label, 0, "", 0, false, [], false, 0, "", "draft");
}
