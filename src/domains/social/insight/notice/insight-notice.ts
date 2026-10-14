/**
 * The insight notice records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight notice is in its life cycle. */
export type InsightNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A insight notice. Its code is unique within a tenant. */
export class InsightNotice {
  code: string;
  title: string;
  expiresAt: number;
  cohort: string;
  openRate: number;
  revision: number;
  segment: string;
  sequence: number;
  channel: string;
  startsAt: number;
  limit: number;
  status: InsightNoticeStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    cohort: string,
    openRate: number,
    revision: number,
    segment: string,
    sequence: number,
    channel: string,
    startsAt: number,
    limit: number,
    status: InsightNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
    this.openRate = openRate;
    this.revision = revision;
    this.segment = segment;
    this.sequence = sequence;
    this.channel = channel;
    this.startsAt = startsAt;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: InsightNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"insight notice"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.expiresAt - this.openRate) * 100) / 100;
  }

  copy(): InsightNotice {
    return new InsightNotice(
      this.code,
      this.title,
      this.expiresAt,
      this.cohort,
      this.openRate,
      this.revision,
      this.segment,
      this.sequence,
      this.channel,
      this.startsAt,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a insight notice in status planned. */
export function newInsightNotice(code: string, title: string): InsightNotice {
  return new InsightNotice(code, title, 0, "", 0, 0, "", 0, "", 0, 0, "planned");
}
