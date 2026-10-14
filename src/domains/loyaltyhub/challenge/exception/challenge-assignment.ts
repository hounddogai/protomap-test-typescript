import * as text from "../../../../kit/text.js";

/** Where a challenge assignment is in its life cycle. */
export type ChallengeAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A challenge assignment as the challenge team keeps it. */
export class ChallengeAssignment {
  code: string;
  name: string;
  amount: number;
  channel: string;
  version: number;
  expiresAt: number;
  region: string;
  frequencyCap: number;
  conversionRate: number;
  status: ChallengeAssignmentStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    channel: string,
    version: number,
    expiresAt: number,
    region: string,
    frequencyCap: number,
    conversionRate: number,
    status: ChallengeAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.channel = channel;
    this.version = version;
    this.expiresAt = expiresAt;
    this.region = region;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: ChallengeAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ChallengeAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"challenge assignment"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.conversionRate - this.expiresAt) * 100) / 100;
  }

  copy(): ChallengeAssignment {
    return new ChallengeAssignment(
      this.code,
      this.name,
      this.amount,
      this.channel,
      this.version,
      this.expiresAt,
      this.region,
      this.frequencyCap,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a challenge assignment in status draft. */
export function newChallengeAssignment(code: string, name: string): ChallengeAssignment {
  return new ChallengeAssignment(code, name, 0, "", 0, 0, "", 0, 0, "draft");
}
