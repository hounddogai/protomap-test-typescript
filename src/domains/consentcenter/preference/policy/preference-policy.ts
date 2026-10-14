/**
 * The preference policy records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference policy is in its life cycle. */
export type PreferencePolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** One preference policy, with what the planners need to act on it. */
export class PreferencePolicy {
  code: string;
  name: string;
  currency: string;
  attempts: number;
  description: string;
  margin: number;
  journeyId: string;
  channel: string;
  sendAt: number;
  timezone: string;
  segment: string;
  status: PreferencePolicyStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    attempts: number,
    description: string,
    margin: number,
    journeyId: string,
    channel: string,
    sendAt: number,
    timezone: string,
    segment: string,
    status: PreferencePolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.attempts = attempts;
    this.description = description;
    this.margin = margin;
    this.journeyId = journeyId;
    this.channel = channel;
    this.sendAt = sendAt;
    this.timezone = timezone;
    this.segment = segment;
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

  canMoveTo(next: PreferencePolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: PreferencePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round(this.attempts * this.margin * 100) / 100;
  }

  copy(): PreferencePolicy {
    return new PreferencePolicy(
      this.code,
      this.name,
      this.currency,
      this.attempts,
      this.description,
      this.margin,
      this.journeyId,
      this.channel,
      this.sendAt,
      this.timezone,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a preference policy in status requested. */
export function newPreferencePolicy(code: string, name: string): PreferencePolicy {
  return new PreferencePolicy(code, name, "", 0, "", 0, "", "", 0, "", "", "requested");
}
