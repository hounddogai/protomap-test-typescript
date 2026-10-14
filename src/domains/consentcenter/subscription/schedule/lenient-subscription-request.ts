import * as text from "../../../../kit/text.js";

/** Where a lenient subscription request is in its life cycle. */
export type LenientSubscriptionRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient subscription request. Its code is unique within a tenant. */
export class LenientSubscriptionRequest {
  code: string;
  name: string;
  archived: boolean;
  tags: string[];
  utmSource: string;
  retries: number;
  source: string;
  clicks: number;
  contactEmail: string;
  conversionRate: number;
  status: LenientSubscriptionRequestStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    tags: string[],
    utmSource: string,
    retries: number,
    source: string,
    clicks: number,
    contactEmail: string,
    conversionRate: number,
    status: LenientSubscriptionRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.tags = tags;
    this.utmSource = utmSource;
    this.retries = retries;
    this.source = source;
    this.clicks = clicks;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: LenientSubscriptionRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientSubscriptionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient subscription request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient subscription request"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.conversionRate - this.retries) * 100) / 100;
  }

  copy(): LenientSubscriptionRequest {
    return new LenientSubscriptionRequest(
      this.code,
      this.name,
      this.archived,
      this.tags,
      this.utmSource,
      this.retries,
      this.source,
      this.clicks,
      this.contactEmail,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient subscription request in status open. */
export function newLenientSubscriptionRequest(code: string, name: string): LenientSubscriptionRequest {
  return new LenientSubscriptionRequest(code, name, false, [], "", 0, "", 0, "", 0, "open");
}
