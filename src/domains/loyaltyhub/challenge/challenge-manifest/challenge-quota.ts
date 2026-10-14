import * as text from "../../../../kit/text.js";

/** Where a challenge quota is in its life cycle. */
export type ChallengeQuotaStatus = "created" | "validated" | "published" | "retired";

/** One challenge quota, with what the planners need to act on it. */
export class ChallengeQuota {
  code: string;
  title: string;
  threshold: number;
  weight: number;
  budget: number;
  cohort: string;
  sequence: number;
  currency: string;
  revision: number;
  campaignRef: string;
  frequencyCap: number;
  status: ChallengeQuotaStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    weight: number,
    budget: number,
    cohort: string,
    sequence: number,
    currency: string,
    revision: number,
    campaignRef: string,
    frequencyCap: number,
    status: ChallengeQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.weight = weight;
    this.budget = budget;
    this.cohort = cohort;
    this.sequence = sequence;
    this.currency = currency;
    this.revision = revision;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"challenge quota"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.frequencyCap - this.revision) * 100) / 100;
  }

  copy(): ChallengeQuota {
    return new ChallengeQuota(
      this.code,
      this.title,
      this.threshold,
      this.weight,
      this.budget,
      this.cohort,
      this.sequence,
      this.currency,
      this.revision,
      this.campaignRef,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a challenge quota in status created. */
export function newChallengeQuota(code: string, title: string): ChallengeQuota {
  return new ChallengeQuota(code, title, 0, 0, 0, "", 0, "", 0, "", 0, "created");
}
