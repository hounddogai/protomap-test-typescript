import * as text from "../../../../kit/text.js";

/** Where a primary mention rule is in its life cycle. */
export type PrimaryMentionRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary mention rule and its current status. */
export class PrimaryMentionRule {
  code: string;
  name: string;
  archived: boolean;
  locale: string;
  conversionRate: number;
  segment: string;
  capacity: number;
  durationMinutes: number;
  audienceId: string;
  version: number;
  contactEmail: string;
  status: PrimaryMentionRuleStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    locale: string,
    conversionRate: number,
    segment: string,
    capacity: number,
    durationMinutes: number,
    audienceId: string,
    version: number,
    contactEmail: string,
    status: PrimaryMentionRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.segment = segment;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.version = version;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: PrimaryMentionRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryMentionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary mention rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round(this.version * this.capacity * 100) / 100;
  }

  copy(): PrimaryMentionRule {
    return new PrimaryMentionRule(
      this.code,
      this.name,
      this.archived,
      this.locale,
      this.conversionRate,
      this.segment,
      this.capacity,
      this.durationMinutes,
      this.audienceId,
      this.version,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary mention rule in status requested. */
export function newPrimaryMentionRule(code: string, name: string): PrimaryMentionRule {
  return new PrimaryMentionRule(code, name, false, "", 0, "", 0, 0, "", 0, "", "requested");
}
