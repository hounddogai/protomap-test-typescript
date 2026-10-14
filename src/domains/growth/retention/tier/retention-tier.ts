/**
 * The retention tier records of growth's retention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention tier is in its life cycle. */
export type RetentionTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A retention tier. Its code is unique within a tenant. */
export class RetentionTier {
  code: string;
  title: string;
  journeyId: string;
  startsAt: number;
  label: string;
  channel: string;
  createdAt: number;
  active: boolean;
  retries: number;
  utmSource: string;
  approved: boolean;
  status: RetentionTierStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    startsAt: number,
    label: string,
    channel: string,
    createdAt: number,
    active: boolean,
    retries: number,
    utmSource: string,
    approved: boolean,
    status: RetentionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.startsAt = startsAt;
    this.label = label;
    this.channel = channel;
    this.createdAt = createdAt;
    this.active = active;
    this.retries = retries;
    this.utmSource = utmSource;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.retries - this.startsAt) * 100) / 100;
  }

  copy(): RetentionTier {
    return new RetentionTier(
      this.code,
      this.title,
      this.journeyId,
      this.startsAt,
      this.label,
      this.channel,
      this.createdAt,
      this.active,
      this.retries,
      this.utmSource,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a retention tier in status new. */
export function newRetentionTier(code: string, title: string): RetentionTier {
  return new RetentionTier(code, title, "", 0, "", "", 0, false, 0, "", false, "new");
}
