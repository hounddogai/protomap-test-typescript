import * as text from "../../../../kit/text.js";

/** Where a reply rule is in its life cycle. */
export type ReplyRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reply rule. Its code is unique within a tenant. */
export class ReplyRule {
  code: string;
  title: string;
  cohort: string;
  expiresAt: number;
  checksum: string;
  segment: string;
  startsAt: number;
  channel: string;
  externalRef: string;
  locale: string;
  status: ReplyRuleStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    expiresAt: number,
    checksum: string,
    segment: string,
    startsAt: number,
    channel: string,
    externalRef: string,
    locale: string,
    status: ReplyRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.segment = segment;
    this.startsAt = startsAt;
    this.channel = channel;
    this.externalRef = externalRef;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ReplyRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round(this.expiresAt * this.startsAt * 100) / 100;
  }

  copy(): ReplyRule {
    return new ReplyRule(
      this.code,
      this.title,
      this.cohort,
      this.expiresAt,
      this.checksum,
      this.segment,
      this.startsAt,
      this.channel,
      this.externalRef,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a reply rule in status proposed. */
export function newReplyRule(code: string, title: string): ReplyRule {
  return new ReplyRule(code, title, "", 0, "", "", 0, "", "", "", "proposed");
}
