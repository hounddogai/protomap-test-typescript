/**
 * The manual domain score records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual domain score is in its life cycle. */
export type ManualDomainScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** One manual domain score, with what the planners need to act on it. */
export class ManualDomainScore {
  code: string;
  title: string;
  clicks: number;
  impressions: number;
  sendAt: number;
  segment: string;
  journeyId: string;
  label: string;
  name: string;
  locale: string;
  status: ManualDomainScoreStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    impressions: number,
    sendAt: number,
    segment: string,
    journeyId: string,
    label: string,
    name: string,
    locale: string,
    status: ManualDomainScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.impressions = impressions;
    this.sendAt = sendAt;
    this.segment = segment;
    this.journeyId = journeyId;
    this.label = label;
    this.name = name;
    this.locale = locale;
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

  canMoveTo(next: ManualDomainScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualDomainScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual domain score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"manual domain score"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.clicks - this.sendAt) * 100) / 100;
  }

  copy(): ManualDomainScore {
    return new ManualDomainScore(
      this.code,
      this.title,
      this.clicks,
      this.impressions,
      this.sendAt,
      this.segment,
      this.journeyId,
      this.label,
      this.name,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual domain score in status requested. */
export function newManualDomainScore(code: string, title: string): ManualDomainScore {
  return new ManualDomainScore(code, title, 0, 0, 0, "", "", "", "", "", "requested");
}
