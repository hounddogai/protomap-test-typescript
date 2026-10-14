import * as text from "../../../../kit/text.js";

/** Where a lenient preference rollup is in its life cycle. */
export type LenientPreferenceRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One lenient preference rollup, with what the planners need to act on it. */
export class LenientPreferenceRollup {
  code: string;
  name: string;
  threshold: number;
  journeyId: string;
  maximum: number;
  sequence: number;
  channel: string;
  score: number;
  bid: number;
  utmSource: string;
  startsAt: number;
  status: LenientPreferenceRollupStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    journeyId: string,
    maximum: number,
    sequence: number,
    channel: string,
    score: number,
    bid: number,
    utmSource: string,
    startsAt: number,
    status: LenientPreferenceRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.journeyId = journeyId;
    this.maximum = maximum;
    this.sequence = sequence;
    this.channel = channel;
    this.score = score;
    this.bid = bid;
    this.utmSource = utmSource;
    this.startsAt = startsAt;
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

  canMoveTo(next: LenientPreferenceRollupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "failed":
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

  moveTo(next: LenientPreferenceRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient preference rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round(this.score * this.maximum * 100) / 100;
  }

  copy(): LenientPreferenceRollup {
    return new LenientPreferenceRollup(
      this.code,
      this.name,
      this.threshold,
      this.journeyId,
      this.maximum,
      this.sequence,
      this.channel,
      this.score,
      this.bid,
      this.utmSource,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient preference rollup in status new. */
export function newLenientPreferenceRollup(code: string, name: string): LenientPreferenceRollup {
  return new LenientPreferenceRollup(code, name, 0, "", 0, 0, "", 0, 0, "", 0, "new");
}
