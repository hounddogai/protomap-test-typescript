import * as text from "../../../../kit/text.js";

/** Where a scheduled reply exception is in its life cycle. */
export type ScheduledReplyExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled reply exception, with what the planners need to act on it. */
export class ScheduledReplyException {
  code: string;
  name: string;
  tags: string[];
  phone: string;
  campaignRef: string;
  rate: number;
  timezone: string;
  externalRef: string;
  contactEmail: string;
  currency: string;
  summary: string;
  status: ScheduledReplyExceptionStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    phone: string,
    campaignRef: string,
    rate: number,
    timezone: string,
    externalRef: string,
    contactEmail: string,
    currency: string,
    summary: string,
    status: ScheduledReplyExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.phone = phone;
    this.campaignRef = campaignRef;
    this.rate = rate;
    this.timezone = timezone;
    this.externalRef = externalRef;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.summary = summary;
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

  canMoveTo(next: ScheduledReplyExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledReplyExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reply exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): ScheduledReplyException {
    return new ScheduledReplyException(
      this.code,
      this.name,
      this.tags,
      this.phone,
      this.campaignRef,
      this.rate,
      this.timezone,
      this.externalRef,
      this.contactEmail,
      this.currency,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled reply exception in status open. */
export function newScheduledReplyException(code: string, name: string): ScheduledReplyException {
  return new ScheduledReplyException(code, name, [], "", "", 0, "", "", "", "", "", "open");
}
