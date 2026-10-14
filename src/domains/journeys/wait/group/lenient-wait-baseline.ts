import * as text from "../../../../kit/text.js";

/** Where a lenient wait baseline is in its life cycle. */
export type LenientWaitBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One lenient wait baseline, with what the planners need to act on it. */
export class LenientWaitBaseline {
  code: string;
  title: string;
  audienceId: string;
  floorValue: number;
  durationMinutes: number;
  region: string;
  ownerId: string;
  capacity: number;
  status: LenientWaitBaselineStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    floorValue: number,
    durationMinutes: number,
    region: string,
    ownerId: string,
    capacity: number,
    status: LenientWaitBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.region = region;
    this.ownerId = ownerId;
    this.capacity = capacity;
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

  canMoveTo(next: LenientWaitBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientWaitBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient wait baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round((this.durationMinutes - this.floorValue) * 100) / 100;
  }

  copy(): LenientWaitBaseline {
    return new LenientWaitBaseline(
      this.code,
      this.title,
      this.audienceId,
      this.floorValue,
      this.durationMinutes,
      this.region,
      this.ownerId,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient wait baseline in status open. */
export function newLenientWaitBaseline(code: string, title: string): LenientWaitBaseline {
  return new LenientWaitBaseline(code, title, "", 0, 0, "", "", 0, "open");
}
