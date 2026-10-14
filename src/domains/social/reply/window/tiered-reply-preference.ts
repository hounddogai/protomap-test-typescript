import * as text from "../../../../kit/text.js";

/** Where a tiered reply preference is in its life cycle. */
export type TieredReplyPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One tiered reply preference, with what the planners need to act on it. */
export class TieredReplyPreference {
  code: string;
  name: string;
  startsAt: number;
  unit: string;
  sequence: number;
  score: number;
  audienceId: string;
  floorValue: number;
  source: string;
  threshold: number;
  segment: string;
  status: TieredReplyPreferenceStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    unit: string,
    sequence: number,
    score: number,
    audienceId: string,
    floorValue: number,
    source: string,
    threshold: number,
    segment: string,
    status: TieredReplyPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.unit = unit;
    this.sequence = sequence;
    this.score = score;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.source = source;
    this.threshold = threshold;
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

  canMoveTo(next: TieredReplyPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredReplyPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reply preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered reply preference"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.threshold + this.sequence) * 100) / 100;
  }

  copy(): TieredReplyPreference {
    return new TieredReplyPreference(
      this.code,
      this.name,
      this.startsAt,
      this.unit,
      this.sequence,
      this.score,
      this.audienceId,
      this.floorValue,
      this.source,
      this.threshold,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered reply preference in status planned. */
export function newTieredReplyPreference(code: string, name: string): TieredReplyPreference {
  return new TieredReplyPreference(code, name, 0, "", 0, 0, "", 0, "", 0, "", "planned");
}
