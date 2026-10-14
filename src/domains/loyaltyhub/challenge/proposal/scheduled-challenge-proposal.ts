/**
 * The scheduled challenge proposal records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled challenge proposal is in its life cycle. */
export type ScheduledChallengeProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a scheduled challenge proposal and its current status. */
export class ScheduledChallengeProposal {
  code: string;
  title: string;
  discount: number;
  score: number;
  impressions: number;
  contactEmail: string;
  name: string;
  channel: string;
  status: ScheduledChallengeProposalStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    score: number,
    impressions: number,
    contactEmail: string,
    name: string,
    channel: string,
    status: ScheduledChallengeProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.score = score;
    this.impressions = impressions;
    this.contactEmail = contactEmail;
    this.name = name;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledChallengeProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledChallengeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled challenge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round((this.score + this.impressions) * 100) / 100;
  }

  copy(): ScheduledChallengeProposal {
    return new ScheduledChallengeProposal(
      this.code,
      this.title,
      this.discount,
      this.score,
      this.impressions,
      this.contactEmail,
      this.name,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled challenge proposal in status planned. */
export function newScheduledChallengeProposal(code: string, title: string): ScheduledChallengeProposal {
  return new ScheduledChallengeProposal(code, title, 0, 0, 0, "", "", "", "planned");
}
