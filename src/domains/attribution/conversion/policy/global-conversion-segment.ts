import * as text from "../../../../kit/text.js";

/** Where a global conversion segment is in its life cycle. */
export type GlobalConversionSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a global conversion segment and its current status. */
export class GlobalConversionSegment {
  code: string;
  title: string;
  floorValue: number;
  pinned: boolean;
  cost: number;
  segment: string;
  name: string;
  priority: number;
  clicks: number;
  status: GlobalConversionSegmentStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    pinned: boolean,
    cost: number,
    segment: string,
    name: string,
    priority: number,
    clicks: number,
    status: GlobalConversionSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.cost = cost;
    this.segment = segment;
    this.name = name;
    this.priority = priority;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalConversionSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalConversionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global conversion segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global conversion segment"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.priority * this.clicks * 100) / 100;
  }

  copy(): GlobalConversionSegment {
    return new GlobalConversionSegment(
      this.code,
      this.title,
      this.floorValue,
      this.pinned,
      this.cost,
      this.segment,
      this.name,
      this.priority,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global conversion segment in status planned. */
export function newGlobalConversionSegment(code: string, title: string): GlobalConversionSegment {
  return new GlobalConversionSegment(code, title, 0, false, 0, "", "", 0, 0, "planned");
}
