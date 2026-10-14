import * as text from "../../../../kit/text.js";

/** Where a regional sla digest is in its life cycle. */
export type RegionalSlaDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional sla digest as the sla team keeps it. */
export class RegionalSlaDigest {
  code: string;
  name: string;
  capacity: number;
  floorValue: number;
  priority: number;
  version: number;
  score: number;
  batchSize: number;
  ownerId: string;
  status: RegionalSlaDigestStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    floorValue: number,
    priority: number,
    version: number,
    score: number,
    batchSize: number,
    ownerId: string,
    status: RegionalSlaDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.priority = priority;
    this.version = version;
    this.score = score;
    this.batchSize = batchSize;
    this.ownerId = ownerId;
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

  canMoveTo(next: RegionalSlaDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSlaDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sla digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"regional sla digest"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.priority + this.version) * 100) / 100;
  }

  copy(): RegionalSlaDigest {
    return new RegionalSlaDigest(
      this.code,
      this.name,
      this.capacity,
      this.floorValue,
      this.priority,
      this.version,
      this.score,
      this.batchSize,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional sla digest in status open. */
export function newRegionalSlaDigest(code: string, name: string): RegionalSlaDigest {
  return new RegionalSlaDigest(code, name, 0, 0, 0, 0, 0, 0, "", "open");
}
