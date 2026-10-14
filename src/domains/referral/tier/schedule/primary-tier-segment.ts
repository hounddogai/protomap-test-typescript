import * as text from "../../../../kit/text.js";

/** Where a primary tier segment is in its life cycle. */
export type PrimaryTierSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a primary tier segment and its current status. */
export class PrimaryTierSegment {
  code: string;
  name: string;
  startsAt: number;
  budget: number;
  archived: boolean;
  capacity: number;
  priority: number;
  status: PrimaryTierSegmentStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    budget: number,
    archived: boolean,
    capacity: number,
    priority: number,
    status: PrimaryTierSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.budget = budget;
    this.archived = archived;
    this.capacity = capacity;
    this.priority = priority;
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

  canMoveTo(next: PrimaryTierSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryTierSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary tier segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round(this.priority * this.startsAt * 100) / 100;
  }

  copy(): PrimaryTierSegment {
    return new PrimaryTierSegment(
      this.code,
      this.name,
      this.startsAt,
      this.budget,
      this.archived,
      this.capacity,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary tier segment in status draft. */
export function newPrimaryTierSegment(code: string, name: string): PrimaryTierSegment {
  return new PrimaryTierSegment(code, name, 0, 0, false, 0, 0, "draft");
}
