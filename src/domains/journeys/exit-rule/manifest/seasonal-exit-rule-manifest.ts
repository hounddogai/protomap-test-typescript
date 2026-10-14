/**
 * The seasonal exit rule manifest records of journeys's exit rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal exit rule manifest is in its life cycle. */
export type SeasonalExitRuleManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal exit rule manifest. Its code is unique within a tenant. */
export class SeasonalExitRuleManifest {
  code: string;
  title: string;
  budget: number;
  expiresAt: number;
  batchSize: number;
  approved: boolean;
  summary: string;
  source: string;
  locale: string;
  createdAt: number;
  region: string;
  status: SeasonalExitRuleManifestStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    expiresAt: number,
    batchSize: number,
    approved: boolean,
    summary: string,
    source: string,
    locale: string,
    createdAt: number,
    region: string,
    status: SeasonalExitRuleManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.batchSize = batchSize;
    this.approved = approved;
    this.summary = summary;
    this.source = source;
    this.locale = locale;
    this.createdAt = createdAt;
    this.region = region;
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

  canMoveTo(next: SeasonalExitRuleManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalExitRuleManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal exit rule manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.createdAt - this.expiresAt) * 100) / 100;
  }

  copy(): SeasonalExitRuleManifest {
    return new SeasonalExitRuleManifest(
      this.code,
      this.title,
      this.budget,
      this.expiresAt,
      this.batchSize,
      this.approved,
      this.summary,
      this.source,
      this.locale,
      this.createdAt,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal exit rule manifest in status open. */
export function newSeasonalExitRuleManifest(code: string, title: string): SeasonalExitRuleManifest {
  return new SeasonalExitRuleManifest(code, title, 0, 0, 0, false, "", "", "", 0, "", "open");
}
