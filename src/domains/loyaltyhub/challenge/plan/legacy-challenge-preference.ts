import * as text from "../../../../kit/text.js";

/** Where a legacy challenge preference is in its life cycle. */
export type LegacyChallengePreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a legacy challenge preference and its current status. */
export class LegacyChallengePreference {
  code: string;
  title: string;
  clicks: number;
  ownerId: string;
  segment: string;
  budget: number;
  cohort: string;
  channel: string;
  campaignRef: string;
  locale: string;
  status: LegacyChallengePreferenceStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    ownerId: string,
    segment: string,
    budget: number,
    cohort: string,
    channel: string,
    campaignRef: string,
    locale: string,
    status: LegacyChallengePreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.ownerId = ownerId;
    this.segment = segment;
    this.budget = budget;
    this.cohort = cohort;
    this.channel = channel;
    this.campaignRef = campaignRef;
    this.locale = locale;
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

  canMoveTo(next: LegacyChallengePreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyChallengePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy challenge preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.budget + this.clicks) * 100) / 100;
  }

  copy(): LegacyChallengePreference {
    return new LegacyChallengePreference(
      this.code,
      this.title,
      this.clicks,
      this.ownerId,
      this.segment,
      this.budget,
      this.cohort,
      this.channel,
      this.campaignRef,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy challenge preference in status planned. */
export function newLegacyChallengePreference(code: string, title: string): LegacyChallengePreference {
  return new LegacyChallengePreference(code, title, 0, "", "", 0, "", "", "", "", "planned");
}
