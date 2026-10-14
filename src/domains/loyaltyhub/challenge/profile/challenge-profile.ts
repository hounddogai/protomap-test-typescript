/**
 * The challenge profile records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge profile is in its life cycle. */
export type ChallengeProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A challenge profile as the challenge team keeps it. */
export class ChallengeProfile {
  code: string;
  title: string;
  contactEmail: string;
  timezone: string;
  channel: string;
  batchSize: number;
  status: ChallengeProfileStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    timezone: string,
    channel: string,
    batchSize: number,
    status: ChallengeProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.timezone = timezone;
    this.channel = channel;
    this.batchSize = batchSize;
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

  canMoveTo(next: ChallengeProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ChallengeProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"challenge profile"} ${this.code}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): ChallengeProfile {
    return new ChallengeProfile(
      this.code,
      this.title,
      this.contactEmail,
      this.timezone,
      this.channel,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a challenge profile in status proposed. */
export function newChallengeProfile(code: string, title: string): ChallengeProfile {
  return new ChallengeProfile(code, title, "", "", "", 0, "proposed");
}
