import * as text from "../../../../kit/text.js";

/** Where a rolling badge draft is in its life cycle. */
export type RollingBadgeDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling badge draft as the badge team keeps it. */
export class RollingBadgeDraft {
  code: string;
  name: string;
  journeyId: string;
  contactEmail: string;
  impressions: number;
  utmSource: string;
  reviewer: string;
  currency: string;
  weight: number;
  updatedAt: number;
  summary: string;
  status: RollingBadgeDraftStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    contactEmail: string,
    impressions: number,
    utmSource: string,
    reviewer: string,
    currency: string,
    weight: number,
    updatedAt: number,
    summary: string,
    status: RollingBadgeDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.impressions = impressions;
    this.utmSource = utmSource;
    this.reviewer = reviewer;
    this.currency = currency;
    this.weight = weight;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: RollingBadgeDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingBadgeDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling badge draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round(this.updatedAt * this.weight * 100) / 100;
  }

  copy(): RollingBadgeDraft {
    return new RollingBadgeDraft(
      this.code,
      this.name,
      this.journeyId,
      this.contactEmail,
      this.impressions,
      this.utmSource,
      this.reviewer,
      this.currency,
      this.weight,
      this.updatedAt,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling badge draft in status open. */
export function newRollingBadgeDraft(code: string, name: string): RollingBadgeDraft {
  return new RollingBadgeDraft(code, name, "", "", 0, "", "", "", 0, 0, "", "open");
}
