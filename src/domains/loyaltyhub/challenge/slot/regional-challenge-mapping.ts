import * as text from "../../../../kit/text.js";

/** Where a regional challenge mapping is in its life cycle. */
export type RegionalChallengeMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a regional challenge mapping and its current status. */
export class RegionalChallengeMapping {
  code: string;
  label: string;
  cohort: string;
  ownerId: string;
  batchSize: number;
  category: string;
  reviewer: string;
  conversionRate: number;
  audienceId: string;
  minimum: number;
  contactEmail: string;
  status: RegionalChallengeMappingStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    ownerId: string,
    batchSize: number,
    category: string,
    reviewer: string,
    conversionRate: number,
    audienceId: string,
    minimum: number,
    contactEmail: string,
    status: RegionalChallengeMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.category = category;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.audienceId = audienceId;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: RegionalChallengeMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalChallengeMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional challenge mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round(this.minimum * this.conversionRate * 100) / 100;
  }

  copy(): RegionalChallengeMapping {
    return new RegionalChallengeMapping(
      this.code,
      this.label,
      this.cohort,
      this.ownerId,
      this.batchSize,
      this.category,
      this.reviewer,
      this.conversionRate,
      this.audienceId,
      this.minimum,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a regional challenge mapping in status proposed. */
export function newRegionalChallengeMapping(code: string, label: string): RegionalChallengeMapping {
  return new RegionalChallengeMapping(code, label, "", "", 0, "", "", 0, "", 0, "", "proposed");
}
