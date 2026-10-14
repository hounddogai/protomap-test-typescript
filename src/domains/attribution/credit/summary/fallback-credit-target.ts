import * as text from "../../../../kit/text.js";

/** Where a fallback credit target is in its life cycle. */
export type FallbackCreditTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback credit target. Its code is unique within a tenant. */
export class FallbackCreditTarget {
  code: string;
  name: string;
  rate: number;
  expiresAt: number;
  cohort: string;
  campaignRef: string;
  checksum: string;
  journeyId: string;
  ceiling: number;
  windowDays: number;
  version: number;
  status: FallbackCreditTargetStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    expiresAt: number,
    cohort: string,
    campaignRef: string,
    checksum: string,
    journeyId: string,
    ceiling: number,
    windowDays: number,
    version: number,
    status: FallbackCreditTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
    this.campaignRef = campaignRef;
    this.checksum = checksum;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
    this.windowDays = windowDays;
    this.version = version;
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

  canMoveTo(next: FallbackCreditTargetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCreditTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback credit target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netTotal(): number {
    return Math.round(this.rate * this.ceiling * 100) / 100;
  }

  copy(): FallbackCreditTarget {
    return new FallbackCreditTarget(
      this.code,
      this.name,
      this.rate,
      this.expiresAt,
      this.cohort,
      this.campaignRef,
      this.checksum,
      this.journeyId,
      this.ceiling,
      this.windowDays,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback credit target in status open. */
export function newFallbackCreditTarget(code: string, name: string): FallbackCreditTarget {
  return new FallbackCreditTarget(code, name, 0, 0, "", "", "", "", 0, 0, 0, "open");
}
