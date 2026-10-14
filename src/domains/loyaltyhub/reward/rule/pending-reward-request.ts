import * as text from "../../../../kit/text.js";

/** Where a pending reward request is in its life cycle. */
export type PendingRewardRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pending reward request and its current status. */
export class PendingRewardRequest {
  code: string;
  label: string;
  graceDays: number;
  utmSource: string;
  segment: string;
  checksum: string;
  tags: string[];
  limit: number;
  attempts: number;
  pinned: boolean;
  status: PendingRewardRequestStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    utmSource: string,
    segment: string,
    checksum: string,
    tags: string[],
    limit: number,
    attempts: number,
    pinned: boolean,
    status: PendingRewardRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.utmSource = utmSource;
    this.segment = segment;
    this.checksum = checksum;
    this.tags = tags;
    this.limit = limit;
    this.attempts = attempts;
    this.pinned = pinned;
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

  canMoveTo(next: PendingRewardRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingRewardRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending reward request"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.graceDays + this.attempts) * 100) / 100;
  }

  copy(): PendingRewardRequest {
    return new PendingRewardRequest(
      this.code,
      this.label,
      this.graceDays,
      this.utmSource,
      this.segment,
      this.checksum,
      this.tags,
      this.limit,
      this.attempts,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending reward request in status draft. */
export function newPendingRewardRequest(code: string, label: string): PendingRewardRequest {
  return new PendingRewardRequest(code, label, 0, "", "", "", [], 0, 0, false, "draft");
}
