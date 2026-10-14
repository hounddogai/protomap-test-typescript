import * as text from "../../../../kit/text.js";

/** Where a sla notice is in its life cycle. */
export type SlaNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One sla notice, with what the planners need to act on it. */
export class SlaNotice {
  code: string;
  name: string;
  cohort: string;
  active: boolean;
  externalRef: string;
  contactEmail: string;
  expiresAt: number;
  timezone: string;
  impressions: number;
  floorValue: number;
  campaignRef: string;
  status: SlaNoticeStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    active: boolean,
    externalRef: string,
    contactEmail: string,
    expiresAt: number,
    timezone: string,
    impressions: number,
    floorValue: number,
    campaignRef: string,
    status: SlaNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.active = active;
    this.externalRef = externalRef;
    this.contactEmail = contactEmail;
    this.expiresAt = expiresAt;
    this.timezone = timezone;
    this.impressions = impressions;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.expiresAt + this.floorValue) * 100) / 100;
  }

  copy(): SlaNotice {
    return new SlaNotice(
      this.code,
      this.name,
      this.cohort,
      this.active,
      this.externalRef,
      this.contactEmail,
      this.expiresAt,
      this.timezone,
      this.impressions,
      this.floorValue,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sla notice in status open. */
export function newSlaNotice(code: string, name: string): SlaNotice {
  return new SlaNotice(code, name, "", false, "", "", 0, "", 0, 0, "", "open");
}
