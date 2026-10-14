import * as text from "../../../../kit/text.js";

/** Where a adaptive nudge preference is in its life cycle. */
export type AdaptiveNudgePreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive nudge preference as the nudge team keeps it. */
export class AdaptiveNudgePreference {
  code: string;
  label: string;
  campaignRef: string;
  source: string;
  currency: string;
  clicks: number;
  startsAt: number;
  updatedAt: number;
  visible: boolean;
  impressions: number;
  status: AdaptiveNudgePreferenceStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    source: string,
    currency: string,
    clicks: number,
    startsAt: number,
    updatedAt: number,
    visible: boolean,
    impressions: number,
    status: AdaptiveNudgePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.source = source;
    this.currency = currency;
    this.clicks = clicks;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.visible = visible;
    this.impressions = impressions;
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

  canMoveTo(next: AdaptiveNudgePreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveNudgePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive nudge preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round(this.clicks * this.startsAt * 100) / 100;
  }

  copy(): AdaptiveNudgePreference {
    return new AdaptiveNudgePreference(
      this.code,
      this.label,
      this.campaignRef,
      this.source,
      this.currency,
      this.clicks,
      this.startsAt,
      this.updatedAt,
      this.visible,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive nudge preference in status new. */
export function newAdaptiveNudgePreference(code: string, label: string): AdaptiveNudgePreference {
  return new AdaptiveNudgePreference(code, label, "", "", "", 0, 0, 0, false, 0, "new");
}
