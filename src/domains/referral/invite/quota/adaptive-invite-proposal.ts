import * as text from "../../../../kit/text.js";

/** Where a adaptive invite proposal is in its life cycle. */
export type AdaptiveInviteProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive invite proposal. Its code is unique within a tenant. */
export class AdaptiveInviteProposal {
  code: string;
  title: string;
  priority: number;
  createdAt: number;
  ceiling: number;
  durationMinutes: number;
  clicks: number;
  endsAt: number;
  score: number;
  status: AdaptiveInviteProposalStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    createdAt: number,
    ceiling: number,
    durationMinutes: number,
    clicks: number,
    endsAt: number,
    score: number,
    status: AdaptiveInviteProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.createdAt = createdAt;
    this.ceiling = ceiling;
    this.durationMinutes = durationMinutes;
    this.clicks = clicks;
    this.endsAt = endsAt;
    this.score = score;
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

  canMoveTo(next: AdaptiveInviteProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveInviteProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive invite proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round(this.endsAt * this.ceiling * 100) / 100;
  }

  copy(): AdaptiveInviteProposal {
    return new AdaptiveInviteProposal(
      this.code,
      this.title,
      this.priority,
      this.createdAt,
      this.ceiling,
      this.durationMinutes,
      this.clicks,
      this.endsAt,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive invite proposal in status open. */
export function newAdaptiveInviteProposal(code: string, title: string): AdaptiveInviteProposal {
  return new AdaptiveInviteProposal(code, title, 0, 0, 0, 0, 0, 0, 0, "open");
}
