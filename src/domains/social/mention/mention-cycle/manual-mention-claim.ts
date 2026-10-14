import * as text from "../../../../kit/text.js";

/** Where a manual mention claim is in its life cycle. */
export type ManualMentionClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a manual mention claim and its current status. */
export class ManualMentionClaim {
  code: string;
  name: string;
  journeyId: string;
  locale: string;
  durationMinutes: number;
  title: string;
  archived: boolean;
  attempts: number;
  endsAt: number;
  expiresAt: number;
  maximum: number;
  status: ManualMentionClaimStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    locale: string,
    durationMinutes: number,
    title: string,
    archived: boolean,
    attempts: number,
    endsAt: number,
    expiresAt: number,
    maximum: number,
    status: ManualMentionClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.title = title;
    this.archived = archived;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.expiresAt = expiresAt;
    this.maximum = maximum;
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

  canMoveTo(next: ManualMentionClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualMentionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual mention claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.maximum * this.endsAt * 100) / 100;
  }

  copy(): ManualMentionClaim {
    return new ManualMentionClaim(
      this.code,
      this.name,
      this.journeyId,
      this.locale,
      this.durationMinutes,
      this.title,
      this.archived,
      this.attempts,
      this.endsAt,
      this.expiresAt,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual mention claim in status open. */
export function newManualMentionClaim(code: string, name: string): ManualMentionClaim {
  return new ManualMentionClaim(code, name, "", "", 0, "", false, 0, 0, 0, 0, "open");
}
