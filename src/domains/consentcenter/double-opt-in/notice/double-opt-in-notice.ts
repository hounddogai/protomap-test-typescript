/**
 * The double opt in notice records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in notice is in its life cycle. */
export type DoubleOptInNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One double opt in notice, with what the planners need to act on it. */
export class DoubleOptInNotice {
  code: string;
  title: string;
  limit: number;
  country: string;
  campaignRef: string;
  utmSource: string;
  status: DoubleOptInNoticeStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    country: string,
    campaignRef: string,
    utmSource: string,
    status: DoubleOptInNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.country = country;
    this.campaignRef = campaignRef;
    this.utmSource = utmSource;
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

  canMoveTo(next: DoubleOptInNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
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

  moveTo(next: DoubleOptInNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): DoubleOptInNotice {
    return new DoubleOptInNotice(
      this.code,
      this.title,
      this.limit,
      this.country,
      this.campaignRef,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a double opt in notice in status proposed. */
export function newDoubleOptInNotice(code: string, title: string): DoubleOptInNotice {
  return new DoubleOptInNotice(code, title, 0, "", "", "", "proposed");
}
