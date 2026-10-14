import * as text from "../../../../kit/text.js";

/** Where a seasonal pacing profile is in its life cycle. */
export type SeasonalPacingProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a seasonal pacing profile and its current status. */
export class SeasonalPacingProfile {
  code: string;
  title: string;
  campaignRef: string;
  ceiling: number;
  sequence: number;
  attributes: Map<string, string>;
  score: number;
  rate: number;
  version: number;
  pinned: boolean;
  status: SeasonalPacingProfileStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    ceiling: number,
    sequence: number,
    attributes: Map<string, string>,
    score: number,
    rate: number,
    version: number,
    pinned: boolean,
    status: SeasonalPacingProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.ceiling = ceiling;
    this.sequence = sequence;
    this.attributes = attributes;
    this.score = score;
    this.rate = rate;
    this.version = version;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalPacingProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalPacingProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal pacing profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.ceiling + this.sequence) * 100) / 100;
  }

  copy(): SeasonalPacingProfile {
    return new SeasonalPacingProfile(
      this.code,
      this.title,
      this.campaignRef,
      this.ceiling,
      this.sequence,
      this.attributes,
      this.score,
      this.rate,
      this.version,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal pacing profile in status idle. */
export function newSeasonalPacingProfile(code: string, title: string): SeasonalPacingProfile {
  return new SeasonalPacingProfile(code, title, "", 0, 0, new Map<string, string>(), 0, 0, 0, false, "idle");
}
