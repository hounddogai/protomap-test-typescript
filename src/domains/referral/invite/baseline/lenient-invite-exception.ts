import * as text from "../../../../kit/text.js";

/** Where a lenient invite exception is in its life cycle. */
export type LenientInviteExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient invite exception. Its code is unique within a tenant. */
export class LenientInviteException {
  code: string;
  label: string;
  openRate: number;
  campaignRef: string;
  pinned: boolean;
  archived: boolean;
  endsAt: number;
  expiresAt: number;
  locale: string;
  summary: string;
  status: LenientInviteExceptionStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    campaignRef: string,
    pinned: boolean,
    archived: boolean,
    endsAt: number,
    expiresAt: number,
    locale: string,
    summary: string,
    status: LenientInviteExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.archived = archived;
    this.endsAt = endsAt;
    this.expiresAt = expiresAt;
    this.locale = locale;
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

  canMoveTo(next: LenientInviteExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientInviteExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient invite exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round(this.endsAt * this.openRate * 100) / 100;
  }

  copy(): LenientInviteException {
    return new LenientInviteException(
      this.code,
      this.label,
      this.openRate,
      this.campaignRef,
      this.pinned,
      this.archived,
      this.endsAt,
      this.expiresAt,
      this.locale,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient invite exception in status open. */
export function newLenientInviteException(code: string, label: string): LenientInviteException {
  return new LenientInviteException(code, label, 0, "", false, false, 0, 0, "", "", "open");
}
