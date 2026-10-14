import * as text from "../../../../kit/text.js";

/** Where a retention baseline is in its life cycle. */
export type RetentionBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** A retention baseline. Its code is unique within a tenant. */
export class RetentionBaseline {
  code: string;
  title: string;
  campaignRef: string;
  timezone: string;
  updatedAt: number;
  audienceId: string;
  pinned: boolean;
  budget: number;
  ceiling: number;
  status: RetentionBaselineStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    timezone: string,
    updatedAt: number,
    audienceId: string,
    pinned: boolean,
    budget: number,
    ceiling: number,
    status: RetentionBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.timezone = timezone;
    this.updatedAt = updatedAt;
    this.audienceId = audienceId;
    this.pinned = pinned;
    this.budget = budget;
    this.ceiling = ceiling;
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

  canMoveTo(next: RetentionBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RetentionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"retention baseline"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.updatedAt + this.budget) * 100) / 100;
  }

  copy(): RetentionBaseline {
    return new RetentionBaseline(
      this.code,
      this.title,
      this.campaignRef,
      this.timezone,
      this.updatedAt,
      this.audienceId,
      this.pinned,
      this.budget,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a retention baseline in status requested. */
export function newRetentionBaseline(code: string, title: string): RetentionBaseline {
  return new RetentionBaseline(code, title, "", "", 0, "", false, 0, 0, "requested");
}
