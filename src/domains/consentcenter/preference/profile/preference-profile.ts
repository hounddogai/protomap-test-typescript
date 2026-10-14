/**
 * The preference profile records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference profile is in its life cycle. */
export type PreferenceProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A preference profile as the preference team keeps it. */
export class PreferenceProfile {
  code: string;
  name: string;
  channel: string;
  windowDays: number;
  cohort: string;
  expiresAt: number;
  updatedAt: number;
  active: boolean;
  impressions: number;
  summary: string;
  variant: string;
  status: PreferenceProfileStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    windowDays: number,
    cohort: string,
    expiresAt: number,
    updatedAt: number,
    active: boolean,
    impressions: number,
    summary: string,
    variant: string,
    status: PreferenceProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.windowDays = windowDays;
    this.cohort = cohort;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
    this.active = active;
    this.impressions = impressions;
    this.summary = summary;
    this.variant = variant;
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

  canMoveTo(next: PreferenceProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
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

  moveTo(next: PreferenceProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round(this.windowDays * this.impressions * 100) / 100;
  }

  copy(): PreferenceProfile {
    return new PreferenceProfile(
      this.code,
      this.name,
      this.channel,
      this.windowDays,
      this.cohort,
      this.expiresAt,
      this.updatedAt,
      this.active,
      this.impressions,
      this.summary,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a preference profile in status requested. */
export function newPreferenceProfile(code: string, name: string): PreferenceProfile {
  return new PreferenceProfile(code, name, "", 0, "", 0, 0, false, 0, "", "", "requested");
}
