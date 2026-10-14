import * as text from "../../../../kit/text.js";

/** Where a seasonal post draft is in its life cycle. */
export type SeasonalPostDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal post draft. Its code is unique within a tenant. */
export class SeasonalPostDraft {
  code: string;
  title: string;
  channel: string;
  budget: number;
  impressions: number;
  status: SeasonalPostDraftStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    budget: number,
    impressions: number,
    status: SeasonalPostDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.budget = budget;
    this.impressions = impressions;
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

  canMoveTo(next: SeasonalPostDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalPostDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal post draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round((this.impressions + this.budget) * 100) / 100;
  }

  copy(): SeasonalPostDraft {
    return new SeasonalPostDraft(this.code, this.title, this.channel, this.budget, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal post draft in status proposed. */
export function newSeasonalPostDraft(code: string, title: string): SeasonalPostDraft {
  return new SeasonalPostDraft(code, title, "", 0, 0, "proposed");
}
