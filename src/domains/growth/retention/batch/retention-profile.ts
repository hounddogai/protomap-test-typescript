import * as text from "../../../../kit/text.js";

/** Where a retention profile is in its life cycle. */
export type RetentionProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** A retention profile. Its code is unique within a tenant. */
export class RetentionProfile {
  code: string;
  label: string;
  margin: number;
  summary: string;
  region: string;
  revision: number;
  bid: number;
  audienceId: string;
  cost: number;
  budget: number;
  windowDays: number;
  status: RetentionProfileStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    summary: string,
    region: string,
    revision: number,
    bid: number,
    audienceId: string,
    cost: number,
    budget: number,
    windowDays: number,
    status: RetentionProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.summary = summary;
    this.region = region;
    this.revision = revision;
    this.bid = bid;
    this.audienceId = audienceId;
    this.cost = cost;
    this.budget = budget;
    this.windowDays = windowDays;
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

  canMoveTo(next: RetentionProfileStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RetentionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"retention profile"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.cost - this.revision) * 100) / 100;
  }

  copy(): RetentionProfile {
    return new RetentionProfile(
      this.code,
      this.label,
      this.margin,
      this.summary,
      this.region,
      this.revision,
      this.bid,
      this.audienceId,
      this.cost,
      this.budget,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a retention profile in status new. */
export function newRetentionProfile(code: string, label: string): RetentionProfile {
  return new RetentionProfile(code, label, 0, "", "", 0, 0, "", 0, 0, 0, "new");
}
