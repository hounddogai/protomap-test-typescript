import * as text from "../../../../kit/text.js";

/** Where a rolling nudge proposal is in its life cycle. */
export type RollingNudgeProposalStatus = "created" | "validated" | "published" | "retired";

/** A rolling nudge proposal as the nudge team keeps it. */
export class RollingNudgeProposal {
  code: string;
  title: string;
  weight: number;
  floorValue: number;
  priority: number;
  tags: string[];
  clicks: number;
  graceDays: number;
  utmSource: string;
  impressions: number;
  journeyId: string;
  status: RollingNudgeProposalStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    floorValue: number,
    priority: number,
    tags: string[],
    clicks: number,
    graceDays: number,
    utmSource: string,
    impressions: number,
    journeyId: string,
    status: RollingNudgeProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.floorValue = floorValue;
    this.priority = priority;
    this.tags = tags;
    this.clicks = clicks;
    this.graceDays = graceDays;
    this.utmSource = utmSource;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingNudgeProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingNudgeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling nudge proposal"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.clicks - this.impressions) * 100) / 100;
  }

  copy(): RollingNudgeProposal {
    return new RollingNudgeProposal(
      this.code,
      this.title,
      this.weight,
      this.floorValue,
      this.priority,
      this.tags,
      this.clicks,
      this.graceDays,
      this.utmSource,
      this.impressions,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling nudge proposal in status created. */
export function newRollingNudgeProposal(code: string, title: string): RollingNudgeProposal {
  return new RollingNudgeProposal(code, title, 0, 0, 0, [], 0, 0, "", 0, "", "created");
}
