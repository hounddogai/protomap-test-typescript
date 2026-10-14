import * as text from "../../../../kit/text.js";

/** Where a legacy leaderboard draft is in its life cycle. */
export type LegacyLeaderboardDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy leaderboard draft. Its code is unique within a tenant. */
export class LegacyLeaderboardDraft {
  code: string;
  label: string;
  maximum: number;
  ratio: number;
  description: string;
  rate: number;
  journeyId: string;
  name: string;
  channel: string;
  reviewer: string;
  segment: string;
  status: LegacyLeaderboardDraftStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    ratio: number,
    description: string,
    rate: number,
    journeyId: string,
    name: string,
    channel: string,
    reviewer: string,
    segment: string,
    status: LegacyLeaderboardDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.ratio = ratio;
    this.description = description;
    this.rate = rate;
    this.journeyId = journeyId;
    this.name = name;
    this.channel = channel;
    this.reviewer = reviewer;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyLeaderboardDraftStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyLeaderboardDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy leaderboard draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round(this.ratio * this.rate * 100) / 100;
  }

  copy(): LegacyLeaderboardDraft {
    return new LegacyLeaderboardDraft(
      this.code,
      this.label,
      this.maximum,
      this.ratio,
      this.description,
      this.rate,
      this.journeyId,
      this.name,
      this.channel,
      this.reviewer,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy leaderboard draft in status new. */
export function newLegacyLeaderboardDraft(code: string, label: string): LegacyLeaderboardDraft {
  return new LegacyLeaderboardDraft(code, label, 0, 0, "", 0, "", "", "", "", "", "new");
}
