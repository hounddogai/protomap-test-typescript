import * as text from "../../../../kit/text.js";

/** Where a challenge bundle is in its life cycle. */
export type ChallengeBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A challenge bundle as the challenge team keeps it. */
export class ChallengeBundle {
  code: string;
  name: string;
  graceDays: number;
  floorValue: number;
  utmSource: string;
  archived: boolean;
  status: ChallengeBundleStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    floorValue: number,
    utmSource: string,
    archived: boolean,
    status: ChallengeBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.floorValue = floorValue;
    this.utmSource = utmSource;
    this.archived = archived;
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

  canMoveTo(next: ChallengeBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
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

  moveTo(next: ChallengeBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.floorValue * this.graceDays * 100) / 100;
  }

  copy(): ChallengeBundle {
    return new ChallengeBundle(
      this.code,
      this.name,
      this.graceDays,
      this.floorValue,
      this.utmSource,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a challenge bundle in status planned. */
export function newChallengeBundle(code: string, name: string): ChallengeBundle {
  return new ChallengeBundle(code, name, 0, 0, "", false, "planned");
}
