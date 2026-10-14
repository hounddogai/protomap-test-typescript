import * as text from "../../../../kit/text.js";

/** Where a legacy window summary is in its life cycle. */
export type LegacyWindowSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy window summary. Its code is unique within a tenant. */
export class LegacyWindowSummary {
  code: string;
  title: string;
  contactEmail: string;
  archived: boolean;
  variant: string;
  bid: number;
  ceiling: number;
  channel: string;
  checksum: string;
  tags: string[];
  status: LegacyWindowSummaryStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    archived: boolean,
    variant: string,
    bid: number,
    ceiling: number,
    channel: string,
    checksum: string,
    tags: string[],
    status: LegacyWindowSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.archived = archived;
    this.variant = variant;
    this.bid = bid;
    this.ceiling = ceiling;
    this.channel = channel;
    this.checksum = checksum;
    this.tags = tags;
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

  canMoveTo(next: LegacyWindowSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: LegacyWindowSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy window summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.ceiling + this.bid) * 100) / 100;
  }

  copy(): LegacyWindowSummary {
    return new LegacyWindowSummary(
      this.code,
      this.title,
      this.contactEmail,
      this.archived,
      this.variant,
      this.bid,
      this.ceiling,
      this.channel,
      this.checksum,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy window summary in status requested. */
export function newLegacyWindowSummary(code: string, title: string): LegacyWindowSummary {
  return new LegacyWindowSummary(code, title, "", false, "", 0, 0, "", "", [], "requested");
}
