/**
 * The default post milestone records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default post milestone is in its life cycle. */
export type DefaultPostMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default post milestone as the post team keeps it. */
export class DefaultPostMilestone {
  code: string;
  name: string;
  sendAt: number;
  journeyId: string;
  audienceId: string;
  ratio: number;
  status: DefaultPostMilestoneStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    journeyId: string,
    audienceId: string,
    ratio: number,
    status: DefaultPostMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
    this.ratio = ratio;
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

  canMoveTo(next: DefaultPostMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultPostMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default post milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round(this.ratio * this.sendAt * 100) / 100;
  }

  copy(): DefaultPostMilestone {
    return new DefaultPostMilestone(
      this.code,
      this.name,
      this.sendAt,
      this.journeyId,
      this.audienceId,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default post milestone in status proposed. */
export function newDefaultPostMilestone(code: string, name: string): DefaultPostMilestone {
  return new DefaultPostMilestone(code, name, 0, "", "", 0, "proposed");
}
