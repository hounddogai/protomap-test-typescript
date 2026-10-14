import * as text from "../../../../kit/text.js";

/** Where a retention segment is in its life cycle. */
export type RetentionSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One retention segment, with what the planners need to act on it. */
export class RetentionSegment {
  code: string;
  name: string;
  checksum: string;
  budget: number;
  floorValue: number;
  version: number;
  status: RetentionSegmentStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    budget: number,
    floorValue: number,
    version: number,
    status: RetentionSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.budget = budget;
    this.floorValue = floorValue;
    this.version = version;
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

  canMoveTo(next: RetentionSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RetentionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"retention segment"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.floorValue - this.version) * 100) / 100;
  }

  copy(): RetentionSegment {
    return new RetentionSegment(
      this.code,
      this.name,
      this.checksum,
      this.budget,
      this.floorValue,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention segment in status requested. */
export function newRetentionSegment(code: string, name: string): RetentionSegment {
  return new RetentionSegment(code, name, "", 0, 0, 0, "requested");
}
