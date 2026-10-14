/**
 * The journey score records of journeys's journey work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey score is in its life cycle. */
export type JourneyScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** A journey score. Its code is unique within a tenant. */
export class JourneyScore {
  code: string;
  title: string;
  source: string;
  pinned: boolean;
  country: string;
  score: number;
  status: JourneyScoreStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    pinned: boolean,
    country: string,
    score: number,
    status: JourneyScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.pinned = pinned;
    this.country = country;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: JourneyScoreStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): JourneyScore {
    return new JourneyScore(this.code, this.title, this.source, this.pinned, this.country, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a journey score in status new. */
export function newJourneyScore(code: string, title: string): JourneyScore {
  return new JourneyScore(code, title, "", false, "", 0, "new");
}
