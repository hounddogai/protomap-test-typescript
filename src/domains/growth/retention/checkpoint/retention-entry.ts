import * as text from "../../../../kit/text.js";

/** Where a retention entry is in its life cycle. */
export type RetentionEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One retention entry, with what the planners need to act on it. */
export class RetentionEntry {
  code: string;
  name: string;
  campaignRef: string;
  weight: number;
  margin: number;
  floorValue: number;
  impressions: number;
  retries: number;
  batchSize: number;
  archived: boolean;
  status: RetentionEntryStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    weight: number,
    margin: number,
    floorValue: number,
    impressions: number,
    retries: number,
    batchSize: number,
    archived: boolean,
    status: RetentionEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.weight = weight;
    this.margin = margin;
    this.floorValue = floorValue;
    this.impressions = impressions;
    this.retries = retries;
    this.batchSize = batchSize;
    this.archived = archived;
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

  canMoveTo(next: RetentionEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: RetentionEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"retention entry"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.batchSize + this.weight) * 100) / 100;
  }

  copy(): RetentionEntry {
    return new RetentionEntry(
      this.code,
      this.name,
      this.campaignRef,
      this.weight,
      this.margin,
      this.floorValue,
      this.impressions,
      this.retries,
      this.batchSize,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention entry in status open. */
export function newRetentionEntry(code: string, name: string): RetentionEntry {
  return new RetentionEntry(code, name, "", 0, 0, 0, 0, 0, 0, false, "open");
}
