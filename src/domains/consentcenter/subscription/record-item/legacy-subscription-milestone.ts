import * as text from "../../../../kit/text.js";

/** Where a legacy subscription milestone is in its life cycle. */
export type LegacySubscriptionMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy subscription milestone and its current status. */
export class LegacySubscriptionMilestone {
  code: string;
  title: string;
  impressions: number;
  rate: number;
  createdAt: number;
  contactEmail: string;
  source: string;
  cost: number;
  revision: number;
  sequence: number;
  timezone: string;
  status: LegacySubscriptionMilestoneStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    rate: number,
    createdAt: number,
    contactEmail: string,
    source: string,
    cost: number,
    revision: number,
    sequence: number,
    timezone: string,
    status: LegacySubscriptionMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.rate = rate;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.source = source;
    this.cost = cost;
    this.revision = revision;
    this.sequence = sequence;
    this.timezone = timezone;
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

  canMoveTo(next: LegacySubscriptionMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacySubscriptionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy subscription milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.sequence + this.revision) * 100) / 100;
  }

  copy(): LegacySubscriptionMilestone {
    return new LegacySubscriptionMilestone(
      this.code,
      this.title,
      this.impressions,
      this.rate,
      this.createdAt,
      this.contactEmail,
      this.source,
      this.cost,
      this.revision,
      this.sequence,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy subscription milestone in status requested. */
export function newLegacySubscriptionMilestone(code: string, title: string): LegacySubscriptionMilestone {
  return new LegacySubscriptionMilestone(code, title, 0, 0, 0, "", "", 0, 0, 0, "", "requested");
}
