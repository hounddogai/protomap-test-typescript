import * as text from "../../../../kit/text.js";

/** Where a rolling csat profile is in its life cycle. */
export type RollingCsatProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling csat profile, with what the planners need to act on it. */
export class RollingCsatProfile {
  code: string;
  label: string;
  source: string;
  startsAt: number;
  minimum: number;
  category: string;
  revision: number;
  status: RollingCsatProfileStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    startsAt: number,
    minimum: number,
    category: string,
    revision: number,
    status: RollingCsatProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.category = category;
    this.revision = revision;
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

  canMoveTo(next: RollingCsatProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingCsatProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling csat profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.revision + this.startsAt) * 100) / 100;
  }

  copy(): RollingCsatProfile {
    return new RollingCsatProfile(
      this.code,
      this.label,
      this.source,
      this.startsAt,
      this.minimum,
      this.category,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling csat profile in status planned. */
export function newRollingCsatProfile(code: string, label: string): RollingCsatProfile {
  return new RollingCsatProfile(code, label, "", 0, 0, "", 0, "planned");
}
