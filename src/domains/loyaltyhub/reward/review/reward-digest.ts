import * as text from "../../../../kit/text.js";

/** Where a reward digest is in its life cycle. */
export type RewardDigestStatus = "created" | "validated" | "published" | "retired";

/** A reward digest. Its code is unique within a tenant. */
export class RewardDigest {
  code: string;
  title: string;
  country: string;
  cohort: string;
  description: string;
  approved: boolean;
  startsAt: number;
  attempts: number;
  limit: number;
  reviewer: string;
  status: RewardDigestStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    cohort: string,
    description: string,
    approved: boolean,
    startsAt: number,
    attempts: number,
    limit: number,
    reviewer: string,
    status: RewardDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.cohort = cohort;
    this.description = description;
    this.approved = approved;
    this.startsAt = startsAt;
    this.attempts = attempts;
    this.limit = limit;
    this.reviewer = reviewer;
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

  canMoveTo(next: RewardDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RewardDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reward digest"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.limit + this.startsAt) * 100) / 100;
  }

  copy(): RewardDigest {
    return new RewardDigest(
      this.code,
      this.title,
      this.country,
      this.cohort,
      this.description,
      this.approved,
      this.startsAt,
      this.attempts,
      this.limit,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reward digest in status created. */
export function newRewardDigest(code: string, title: string): RewardDigest {
  return new RewardDigest(code, title, "", "", "", false, 0, 0, 0, "", "created");
}
