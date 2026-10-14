/**
 * The legacy complaint draft records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy complaint draft is in its life cycle. */
export type LegacyComplaintDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy complaint draft and its current status. */
export class LegacyComplaintDraft {
  code: string;
  title: string;
  limit: number;
  checksum: string;
  openRate: number;
  utmSource: string;
  country: string;
  windowDays: number;
  archived: boolean;
  channel: string;
  endsAt: number;
  status: LegacyComplaintDraftStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    checksum: string,
    openRate: number,
    utmSource: string,
    country: string,
    windowDays: number,
    archived: boolean,
    channel: string,
    endsAt: number,
    status: LegacyComplaintDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.checksum = checksum;
    this.openRate = openRate;
    this.utmSource = utmSource;
    this.country = country;
    this.windowDays = windowDays;
    this.archived = archived;
    this.channel = channel;
    this.endsAt = endsAt;
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

  canMoveTo(next: LegacyComplaintDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: LegacyComplaintDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy complaint draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netTotal(): number {
    return Math.round((this.windowDays + this.endsAt) * 100) / 100;
  }

  copy(): LegacyComplaintDraft {
    return new LegacyComplaintDraft(
      this.code,
      this.title,
      this.limit,
      this.checksum,
      this.openRate,
      this.utmSource,
      this.country,
      this.windowDays,
      this.archived,
      this.channel,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a legacy complaint draft in status requested. */
export function newLegacyComplaintDraft(code: string, title: string): LegacyComplaintDraft {
  return new LegacyComplaintDraft(code, title, 0, "", 0, "", "", 0, false, "", 0, "requested");
}
