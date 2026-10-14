import * as text from "../../../../kit/text.js";

/** Where a level request is in its life cycle. */
export type LevelRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A level request as the level team keeps it. */
export class LevelRequest {
  code: string;
  label: string;
  checksum: string;
  segment: string;
  minimum: number;
  windowDays: number;
  status: LevelRequestStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    segment: string,
    minimum: number,
    windowDays: number,
    status: LevelRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.segment = segment;
    this.minimum = minimum;
    this.windowDays = windowDays;
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

  canMoveTo(next: LevelRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LevelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round(this.windowDays * this.minimum * 100) / 100;
  }

  copy(): LevelRequest {
    return new LevelRequest(
      this.code,
      this.label,
      this.checksum,
      this.segment,
      this.minimum,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a level request in status planned. */
export function newLevelRequest(code: string, label: string): LevelRequest {
  return new LevelRequest(code, label, "", "", 0, 0, "planned");
}
