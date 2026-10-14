import * as text from "../../../../kit/text.js";

/** Where a preference variance is in its life cycle. */
export type PreferenceVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A preference variance. Its code is unique within a tenant. */
export class PreferenceVariance {
  code: string;
  label: string;
  durationMinutes: number;
  frequencyCap: number;
  checksum: string;
  impressions: number;
  startsAt: number;
  score: number;
  archived: boolean;
  discount: number;
  threshold: number;
  status: PreferenceVarianceStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    frequencyCap: number,
    checksum: string,
    impressions: number,
    startsAt: number,
    score: number,
    archived: boolean,
    discount: number,
    threshold: number,
    status: PreferenceVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.frequencyCap = frequencyCap;
    this.checksum = checksum;
    this.impressions = impressions;
    this.startsAt = startsAt;
    this.score = score;
    this.archived = archived;
    this.discount = discount;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PreferenceVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PreferenceVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.threshold - this.durationMinutes) * 100) / 100;
  }

  copy(): PreferenceVariance {
    return new PreferenceVariance(
      this.code,
      this.label,
      this.durationMinutes,
      this.frequencyCap,
      this.checksum,
      this.impressions,
      this.startsAt,
      this.score,
      this.archived,
      this.discount,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a preference variance in status idle. */
export function newPreferenceVariance(code: string, label: string): PreferenceVariance {
  return new PreferenceVariance(code, label, 0, 0, "", 0, 0, 0, false, 0, 0, "idle");
}
