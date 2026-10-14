import * as text from "../../../../kit/text.js";

/** Where a rolling bid rule preference is in its life cycle. */
export type RollingBidRulePreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a rolling bid rule preference and its current status. */
export class RollingBidRulePreference {
  code: string;
  title: string;
  name: string;
  impressions: number;
  clicks: number;
  expiresAt: number;
  graceDays: number;
  maximum: number;
  status: RollingBidRulePreferenceStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    impressions: number,
    clicks: number,
    expiresAt: number,
    graceDays: number,
    maximum: number,
    status: RollingBidRulePreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.impressions = impressions;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.graceDays = graceDays;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingBidRulePreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingBidRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling bid rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.graceDays + this.expiresAt) * 100) / 100;
  }

  copy(): RollingBidRulePreference {
    return new RollingBidRulePreference(
      this.code,
      this.title,
      this.name,
      this.impressions,
      this.clicks,
      this.expiresAt,
      this.graceDays,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling bid rule preference in status requested. */
export function newRollingBidRulePreference(code: string, title: string): RollingBidRulePreference {
  return new RollingBidRulePreference(code, title, "", 0, 0, 0, 0, 0, "requested");
}
