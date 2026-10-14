/**
 * The seasonal challenge quota records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal challenge quota is in its life cycle. */
export type SeasonalChallengeQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal challenge quota as the challenge team keeps it. */
export class SeasonalChallengeQuota {
  code: string;
  name: string;
  externalRef: string;
  visible: boolean;
  frequencyCap: number;
  tags: string[];
  reviewer: string;
  expiresAt: number;
  ratio: number;
  country: string;
  locale: string;
  status: SeasonalChallengeQuotaStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    visible: boolean,
    frequencyCap: number,
    tags: string[],
    reviewer: string,
    expiresAt: number,
    ratio: number,
    country: string,
    locale: string,
    status: SeasonalChallengeQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.visible = visible;
    this.frequencyCap = frequencyCap;
    this.tags = tags;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.country = country;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalChallengeQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalChallengeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal challenge quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.expiresAt - this.ratio) * 100) / 100;
  }

  copy(): SeasonalChallengeQuota {
    return new SeasonalChallengeQuota(
      this.code,
      this.name,
      this.externalRef,
      this.visible,
      this.frequencyCap,
      this.tags,
      this.reviewer,
      this.expiresAt,
      this.ratio,
      this.country,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal challenge quota in status new. */
export function newSeasonalChallengeQuota(code: string, name: string): SeasonalChallengeQuota {
  return new SeasonalChallengeQuota(code, name, "", false, 0, [], "", 0, 0, "", "", "new");
}
