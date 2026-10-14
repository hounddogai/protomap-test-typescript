import * as text from "../../../../kit/text.js";

/** Where a strict sender profile is in its life cycle. */
export type StrictSenderProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict sender profile as the sender team keeps it. */
export class StrictSenderProfile {
  code: string;
  title: string;
  maximum: number;
  graceDays: number;
  locale: string;
  approved: boolean;
  utmSource: string;
  contactEmail: string;
  journeyId: string;
  attempts: number;
  revision: number;
  status: StrictSenderProfileStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    graceDays: number,
    locale: string,
    approved: boolean,
    utmSource: string,
    contactEmail: string,
    journeyId: string,
    attempts: number,
    revision: number,
    status: StrictSenderProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.locale = locale;
    this.approved = approved;
    this.utmSource = utmSource;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.attempts = attempts;
    this.revision = revision;
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

  canMoveTo(next: StrictSenderProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictSenderProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict sender profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"strict sender profile"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.graceDays + this.revision) * 100) / 100;
  }

  copy(): StrictSenderProfile {
    return new StrictSenderProfile(
      this.code,
      this.title,
      this.maximum,
      this.graceDays,
      this.locale,
      this.approved,
      this.utmSource,
      this.contactEmail,
      this.journeyId,
      this.attempts,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict sender profile in status planned. */
export function newStrictSenderProfile(code: string, title: string): StrictSenderProfile {
  return new StrictSenderProfile(code, title, 0, 0, "", false, "", "", "", 0, 0, "planned");
}
