import * as text from "../../../../kit/text.js";

/** Where a weighted preference baseline is in its life cycle. */
export type WeightedPreferenceBaselineStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One weighted preference baseline, with what the planners need to act on it. */
export class WeightedPreferenceBaseline {
  code: string;
  name: string;
  startsAt: number;
  openRate: number;
  floorValue: number;
  score: number;
  pinned: boolean;
  audienceId: string;
  status: WeightedPreferenceBaselineStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    openRate: number,
    floorValue: number,
    score: number,
    pinned: boolean,
    audienceId: string,
    status: WeightedPreferenceBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.floorValue = floorValue;
    this.score = score;
    this.pinned = pinned;
    this.audienceId = audienceId;
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

  canMoveTo(next: WeightedPreferenceBaselineStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedPreferenceBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted preference baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted preference baseline"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.floorValue * this.score * 100) / 100;
  }

  copy(): WeightedPreferenceBaseline {
    return new WeightedPreferenceBaseline(
      this.code,
      this.name,
      this.startsAt,
      this.openRate,
      this.floorValue,
      this.score,
      this.pinned,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted preference baseline in status draft. */
export function newWeightedPreferenceBaseline(code: string, name: string): WeightedPreferenceBaseline {
  return new WeightedPreferenceBaseline(code, name, 0, 0, 0, 0, false, "", "draft");
}
