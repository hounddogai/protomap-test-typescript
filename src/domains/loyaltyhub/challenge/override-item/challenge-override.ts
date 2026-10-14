/**
 * The challenge override records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge override is in its life cycle. */
export type ChallengeOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One challenge override, with what the planners need to act on it. */
export class ChallengeOverride {
  code: string;
  name: string;
  ratio: number;
  contactEmail: string;
  channel: string;
  status: ChallengeOverrideStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    contactEmail: string,
    channel: string,
    status: ChallengeOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: ChallengeOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ChallengeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): ChallengeOverride {
    return new ChallengeOverride(this.code, this.name, this.ratio, this.contactEmail, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a challenge override in status planned. */
export function newChallengeOverride(code: string, name: string): ChallengeOverride {
  return new ChallengeOverride(code, name, 0, "", "", "planned");
}
