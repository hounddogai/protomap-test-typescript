import * as text from "../../../../kit/text.js";

/** Where a reputation tier is in its life cycle. */
export type ReputationTierStatus = "requested" | "granted" | "revoked" | "expired";

/** One reputation tier, with what the planners need to act on it. */
export class ReputationTier {
  code: string;
  title: string;
  tags: string[];
  durationMinutes: number;
  cohort: string;
  updatedAt: number;
  sequence: number;
  checksum: string;
  createdAt: number;
  impressions: number;
  minimum: number;
  status: ReputationTierStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    durationMinutes: number,
    cohort: string,
    updatedAt: number,
    sequence: number,
    checksum: string,
    createdAt: number,
    impressions: number,
    minimum: number,
    status: ReputationTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.durationMinutes = durationMinutes;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.checksum = checksum;
    this.createdAt = createdAt;
    this.impressions = impressions;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationTierStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reputation tier"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round(this.createdAt * this.sequence * 100) / 100;
  }

  copy(): ReputationTier {
    return new ReputationTier(
      this.code,
      this.title,
      this.tags,
      this.durationMinutes,
      this.cohort,
      this.updatedAt,
      this.sequence,
      this.checksum,
      this.createdAt,
      this.impressions,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reputation tier in status requested. */
export function newReputationTier(code: string, title: string): ReputationTier {
  return new ReputationTier(code, title, [], 0, "", 0, 0, "", 0, 0, 0, "requested");
}
