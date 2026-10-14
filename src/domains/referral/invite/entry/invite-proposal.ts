import * as text from "../../../../kit/text.js";

/** Where a invite proposal is in its life cycle. */
export type InviteProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a invite proposal and its current status. */
export class InviteProposal {
  code: string;
  title: string;
  ratio: number;
  pinned: boolean;
  expiresAt: number;
  sendAt: number;
  clicks: number;
  status: InviteProposalStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    pinned: boolean,
    expiresAt: number,
    sendAt: number,
    clicks: number,
    status: InviteProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.pinned = pinned;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.clicks = clicks;
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

  canMoveTo(next: InviteProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.ratio + this.sendAt) * 100) / 100;
  }

  copy(): InviteProposal {
    return new InviteProposal(
      this.code,
      this.title,
      this.ratio,
      this.pinned,
      this.expiresAt,
      this.sendAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a invite proposal in status open. */
export function newInviteProposal(code: string, title: string): InviteProposal {
  return new InviteProposal(code, title, 0, false, 0, 0, 0, "open");
}
