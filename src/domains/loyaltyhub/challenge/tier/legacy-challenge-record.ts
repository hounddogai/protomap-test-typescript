import * as text from "../../../../kit/text.js";

/** Where a legacy challenge record is in its life cycle. */
export type LegacyChallengeRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy challenge record. Its code is unique within a tenant. */
export class LegacyChallengeRecord {
  code: string;
  name: string;
  locale: string;
  journeyId: string;
  impressions: number;
  variant: string;
  budget: number;
  audienceId: string;
  createdAt: number;
  channel: string;
  reviewer: string;
  status: LegacyChallengeRecordStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    journeyId: string,
    impressions: number,
    variant: string,
    budget: number,
    audienceId: string,
    createdAt: number,
    channel: string,
    reviewer: string,
    status: LegacyChallengeRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.journeyId = journeyId;
    this.impressions = impressions;
    this.variant = variant;
    this.budget = budget;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.channel = channel;
    this.reviewer = reviewer;
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

  canMoveTo(next: LegacyChallengeRecordStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyChallengeRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy challenge record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netTotal(): number {
    return Math.round(this.budget * this.createdAt * 100) / 100;
  }

  copy(): LegacyChallengeRecord {
    return new LegacyChallengeRecord(
      this.code,
      this.name,
      this.locale,
      this.journeyId,
      this.impressions,
      this.variant,
      this.budget,
      this.audienceId,
      this.createdAt,
      this.channel,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy challenge record in status new. */
export function newLegacyChallengeRecord(code: string, name: string): LegacyChallengeRecord {
  return new LegacyChallengeRecord(code, name, "", "", 0, "", 0, "", 0, "", "", "new");
}
