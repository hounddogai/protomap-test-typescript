import * as text from "../../../../kit/text.js";

/** Where a lenient pacing segment is in its life cycle. */
export type LenientPacingSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One lenient pacing segment, with what the planners need to act on it. */
export class LenientPacingSegment {
  code: string;
  title: string;
  attempts: number;
  name: string;
  locale: string;
  score: number;
  frequencyCap: number;
  ownerId: string;
  status: LenientPacingSegmentStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    name: string,
    locale: string,
    score: number,
    frequencyCap: number,
    ownerId: string,
    status: LenientPacingSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.name = name;
    this.locale = locale;
    this.score = score;
    this.frequencyCap = frequencyCap;
    this.ownerId = ownerId;
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

  canMoveTo(next: LenientPacingSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientPacingSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient pacing segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedLoad(): number {
    return Math.round((this.frequencyCap + this.score) * 100) / 100;
  }

  copy(): LenientPacingSegment {
    return new LenientPacingSegment(
      this.code,
      this.title,
      this.attempts,
      this.name,
      this.locale,
      this.score,
      this.frequencyCap,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient pacing segment in status proposed. */
export function newLenientPacingSegment(code: string, title: string): LenientPacingSegment {
  return new LenientPacingSegment(code, title, 0, "", "", 0, 0, "", "proposed");
}
