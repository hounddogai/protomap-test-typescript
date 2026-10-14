import * as text from "../../../../kit/text.js";

/** Where a rolling journey agreement is in its life cycle. */
export type RollingJourneyAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling journey agreement. Its code is unique within a tenant. */
export class RollingJourneyAgreement {
  code: string;
  title: string;
  journeyId: string;
  tags: string[];
  batchSize: number;
  graceDays: number;
  campaignRef: string;
  status: RollingJourneyAgreementStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    tags: string[],
    batchSize: number,
    graceDays: number,
    campaignRef: string,
    status: RollingJourneyAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.tags = tags;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: RollingJourneyAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingJourneyAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling journey agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round(this.batchSize * this.graceDays * 100) / 100;
  }

  copy(): RollingJourneyAgreement {
    return new RollingJourneyAgreement(
      this.code,
      this.title,
      this.journeyId,
      this.tags,
      this.batchSize,
      this.graceDays,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling journey agreement in status planned. */
export function newRollingJourneyAgreement(code: string, title: string): RollingJourneyAgreement {
  return new RollingJourneyAgreement(code, title, "", [], 0, 0, "", "planned");
}
