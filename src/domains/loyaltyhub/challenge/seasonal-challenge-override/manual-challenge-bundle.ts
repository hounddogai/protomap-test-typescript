import * as text from "../../../../kit/text.js";

/** Where a manual challenge bundle is in its life cycle. */
export type ManualChallengeBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual challenge bundle as the challenge team keeps it. */
export class ManualChallengeBundle {
  code: string;
  title: string;
  contactEmail: string;
  attempts: number;
  reviewer: string;
  durationMinutes: number;
  locale: string;
  status: ManualChallengeBundleStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    attempts: number,
    reviewer: string,
    durationMinutes: number,
    locale: string,
    status: ManualChallengeBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
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

  canMoveTo(next: ManualChallengeBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualChallengeBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual challenge bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.attempts - this.durationMinutes) * 100) / 100;
  }

  copy(): ManualChallengeBundle {
    return new ManualChallengeBundle(
      this.code,
      this.title,
      this.contactEmail,
      this.attempts,
      this.reviewer,
      this.durationMinutes,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual challenge bundle in status proposed. */
export function newManualChallengeBundle(code: string, title: string): ManualChallengeBundle {
  return new ManualChallengeBundle(code, title, "", 0, "", 0, "", "proposed");
}
