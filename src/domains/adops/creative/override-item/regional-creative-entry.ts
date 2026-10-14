import * as text from "../../../../kit/text.js";

/** Where a regional creative entry is in its life cycle. */
export type RegionalCreativeEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional creative entry as the creative team keeps it. */
export class RegionalCreativeEntry {
  code: string;
  label: string;
  region: string;
  utmSource: string;
  score: number;
  limit: number;
  priority: number;
  version: number;
  reviewer: string;
  createdAt: number;
  status: RegionalCreativeEntryStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    utmSource: string,
    score: number,
    limit: number,
    priority: number,
    version: number,
    reviewer: string,
    createdAt: number,
    status: RegionalCreativeEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.utmSource = utmSource;
    this.score = score;
    this.limit = limit;
    this.priority = priority;
    this.version = version;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
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

  canMoveTo(next: RegionalCreativeEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RegionalCreativeEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional creative entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"regional creative entry"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.limit * this.version * 100) / 100;
  }

  copy(): RegionalCreativeEntry {
    return new RegionalCreativeEntry(
      this.code,
      this.label,
      this.region,
      this.utmSource,
      this.score,
      this.limit,
      this.priority,
      this.version,
      this.reviewer,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional creative entry in status open. */
export function newRegionalCreativeEntry(code: string, label: string): RegionalCreativeEntry {
  return new RegionalCreativeEntry(code, label, "", "", 0, 0, 0, 0, "", 0, "open");
}
