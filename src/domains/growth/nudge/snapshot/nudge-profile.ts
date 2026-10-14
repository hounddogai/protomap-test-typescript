import * as text from "../../../../kit/text.js";

/** Where a nudge profile is in its life cycle. */
export type NudgeProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One nudge profile, with what the planners need to act on it. */
export class NudgeProfile {
  code: string;
  name: string;
  revision: number;
  retries: number;
  score: number;
  timezone: string;
  openRate: number;
  channel: string;
  status: NudgeProfileStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    retries: number,
    score: number,
    timezone: string,
    openRate: number,
    channel: string,
    status: NudgeProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.retries = retries;
    this.score = score;
    this.timezone = timezone;
    this.openRate = openRate;
    this.channel = channel;
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

  canMoveTo(next: NudgeProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: NudgeProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.revision + this.openRate) * 100) / 100;
  }

  copy(): NudgeProfile {
    return new NudgeProfile(
      this.code,
      this.name,
      this.revision,
      this.retries,
      this.score,
      this.timezone,
      this.openRate,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a nudge profile in status planned. */
export function newNudgeProfile(code: string, name: string): NudgeProfile {
  return new NudgeProfile(code, name, 0, 0, 0, "", 0, "", "planned");
}
