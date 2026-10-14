import * as text from "../../../../kit/text.js";

/** Where a path request is in its life cycle. */
export type PathRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A path request as the path team keeps it. */
export class PathRequest {
  code: string;
  name: string;
  minimum: number;
  impressions: number;
  segment: string;
  status: PathRequestStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    impressions: number,
    segment: string,
    status: PathRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.impressions = impressions;
    this.segment = segment;
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

  canMoveTo(next: PathRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PathRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round(this.impressions * this.minimum * 100) / 100;
  }

  copy(): PathRequest {
    return new PathRequest(this.code, this.name, this.minimum, this.impressions, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a path request in status planned. */
export function newPathRequest(code: string, name: string): PathRequest {
  return new PathRequest(code, name, 0, 0, "", "planned");
}
