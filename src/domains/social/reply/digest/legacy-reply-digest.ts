/**
 * The legacy reply digest records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy reply digest is in its life cycle. */
export type LegacyReplyDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One legacy reply digest, with what the planners need to act on it. */
export class LegacyReplyDigest {
  code: string;
  title: string;
  locale: string;
  bid: number;
  category: string;
  tags: string[];
  timezone: string;
  conversionRate: number;
  openRate: number;
  segment: string;
  source: string;
  status: LegacyReplyDigestStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    bid: number,
    category: string,
    tags: string[],
    timezone: string,
    conversionRate: number,
    openRate: number,
    segment: string,
    source: string,
    status: LegacyReplyDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.bid = bid;
    this.category = category;
    this.tags = tags;
    this.timezone = timezone;
    this.conversionRate = conversionRate;
    this.openRate = openRate;
    this.segment = segment;
    this.source = source;
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

  canMoveTo(next: LegacyReplyDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
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

  moveTo(next: LegacyReplyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reply digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.bid - this.conversionRate) * 100) / 100;
  }

  copy(): LegacyReplyDigest {
    return new LegacyReplyDigest(
      this.code,
      this.title,
      this.locale,
      this.bid,
      this.category,
      this.tags,
      this.timezone,
      this.conversionRate,
      this.openRate,
      this.segment,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy reply digest in status proposed. */
export function newLegacyReplyDigest(code: string, title: string): LegacyReplyDigest {
  return new LegacyReplyDigest(code, title, "", 0, "", [], "", 0, 0, "", "", "proposed");
}
