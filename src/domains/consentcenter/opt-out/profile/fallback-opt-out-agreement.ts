import * as text from "../../../../kit/text.js";

/** Where a fallback opt out agreement is in its life cycle. */
export type FallbackOptOutAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback opt out agreement. Its code is unique within a tenant. */
export class FallbackOptOutAgreement {
  code: string;
  title: string;
  contactEmail: string;
  version: number;
  batchSize: number;
  timezone: string;
  status: FallbackOptOutAgreementStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    version: number,
    batchSize: number,
    timezone: string,
    status: FallbackOptOutAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.version = version;
    this.batchSize = batchSize;
    this.timezone = timezone;
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

  canMoveTo(next: FallbackOptOutAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackOptOutAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback opt out agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"fallback opt out agreement"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.version + this.batchSize) * 100) / 100;
  }

  copy(): FallbackOptOutAgreement {
    return new FallbackOptOutAgreement(
      this.code,
      this.title,
      this.contactEmail,
      this.version,
      this.batchSize,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback opt out agreement in status open. */
export function newFallbackOptOutAgreement(code: string, title: string): FallbackOptOutAgreement {
  return new FallbackOptOutAgreement(code, title, "", 0, 0, "", "open");
}
