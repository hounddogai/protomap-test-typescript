/**
 * The legacy double opt in profile records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy double opt in profile is in its life cycle. */
export type LegacyDoubleOptInProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a legacy double opt in profile and its current status. */
export class LegacyDoubleOptInProfile {
  code: string;
  name: string;
  quantity: number;
  channel: string;
  audienceId: string;
  impressions: number;
  status: LegacyDoubleOptInProfileStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    channel: string,
    audienceId: string,
    impressions: number,
    status: LegacyDoubleOptInProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.channel = channel;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyDoubleOptInProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyDoubleOptInProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy double opt in profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.impressions * this.quantity * 100) / 100;
  }

  copy(): LegacyDoubleOptInProfile {
    return new LegacyDoubleOptInProfile(
      this.code,
      this.name,
      this.quantity,
      this.channel,
      this.audienceId,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy double opt in profile in status draft. */
export function newLegacyDoubleOptInProfile(code: string, name: string): LegacyDoubleOptInProfile {
  return new LegacyDoubleOptInProfile(code, name, 0, "", "", 0, "draft");
}
