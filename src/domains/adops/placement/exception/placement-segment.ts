import * as text from "../../../../kit/text.js";

/** Where a placement segment is in its life cycle. */
export type PlacementSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A placement segment. Its code is unique within a tenant. */
export class PlacementSegment {
  code: string;
  title: string;
  createdAt: number;
  maximum: number;
  graceDays: number;
  tags: string[];
  durationMinutes: number;
  unit: string;
  status: PlacementSegmentStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    maximum: number,
    graceDays: number,
    tags: string[],
    durationMinutes: number,
    unit: string,
    status: PlacementSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.tags = tags;
    this.durationMinutes = durationMinutes;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.graceDays - this.durationMinutes) * 100) / 100;
  }

  copy(): PlacementSegment {
    return new PlacementSegment(
      this.code,
      this.title,
      this.createdAt,
      this.maximum,
      this.graceDays,
      this.tags,
      this.durationMinutes,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a placement segment in status proposed. */
export function newPlacementSegment(code: string, title: string): PlacementSegment {
  return new PlacementSegment(code, title, 0, 0, 0, [], 0, "", "proposed");
}
