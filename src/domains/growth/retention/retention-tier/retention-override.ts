import * as text from "../../../../kit/text.js";

/** Where a retention override is in its life cycle. */
export type RetentionOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A retention override. Its code is unique within a tenant. */
export class RetentionOverride {
  code: string;
  title: string;
  updatedAt: number;
  label: string;
  startsAt: number;
  frequencyCap: number;
  impressions: number;
  batchSize: number;
  source: string;
  status: RetentionOverrideStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    label: string,
    startsAt: number,
    frequencyCap: number,
    impressions: number,
    batchSize: number,
    source: string,
    status: RetentionOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.label = label;
    this.startsAt = startsAt;
    this.frequencyCap = frequencyCap;
    this.impressions = impressions;
    this.batchSize = batchSize;
    this.source = source;
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

  canMoveTo(next: RetentionOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: RetentionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"retention override"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.batchSize + this.frequencyCap) * 100) / 100;
  }

  copy(): RetentionOverride {
    return new RetentionOverride(
      this.code,
      this.title,
      this.updatedAt,
      this.label,
      this.startsAt,
      this.frequencyCap,
      this.impressions,
      this.batchSize,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a retention override in status open. */
export function newRetentionOverride(code: string, title: string): RetentionOverride {
  return new RetentionOverride(code, title, 0, "", 0, 0, 0, 0, "", "open");
}
