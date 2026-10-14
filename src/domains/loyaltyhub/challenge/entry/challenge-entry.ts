/**
 * The challenge entry records of loyaltyhub's challenge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge entry is in its life cycle. */
export type ChallengeEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One challenge entry, with what the planners need to act on it. */
export class ChallengeEntry {
  code: string;
  title: string;
  ratio: number;
  impressions: number;
  weight: number;
  attempts: number;
  tags: string[];
  region: string;
  status: ChallengeEntryStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    impressions: number,
    weight: number,
    attempts: number,
    tags: string[],
    region: string,
    status: ChallengeEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.impressions = impressions;
    this.weight = weight;
    this.attempts = attempts;
    this.tags = tags;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.attempts + this.impressions) * 100) / 100;
  }

  copy(): ChallengeEntry {
    return new ChallengeEntry(
      this.code,
      this.title,
      this.ratio,
      this.impressions,
      this.weight,
      this.attempts,
      this.tags,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a challenge entry in status draft. */
export function newChallengeEntry(code: string, title: string): ChallengeEntry {
  return new ChallengeEntry(code, title, 0, 0, 0, 0, [], "", "draft");
}
