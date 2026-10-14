import * as text from "../../../../kit/text.js";

/** Where a challenge digest is in its life cycle. */
export type ChallengeDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One challenge digest, with what the planners need to act on it. */
export class ChallengeDigest {
  code: string;
  label: string;
  createdAt: number;
  quantity: number;
  unit: string;
  floorValue: number;
  score: number;
  windowDays: number;
  channel: string;
  bid: number;
  archived: boolean;
  status: ChallengeDigestStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    quantity: number,
    unit: string,
    floorValue: number,
    score: number,
    windowDays: number,
    channel: string,
    bid: number,
    archived: boolean,
    status: ChallengeDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.quantity = quantity;
    this.unit = unit;
    this.floorValue = floorValue;
    this.score = score;
    this.windowDays = windowDays;
    this.channel = channel;
    this.bid = bid;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"challenge digest"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.quantity - this.bid) * 100) / 100;
  }

  copy(): ChallengeDigest {
    return new ChallengeDigest(
      this.code,
      this.label,
      this.createdAt,
      this.quantity,
      this.unit,
      this.floorValue,
      this.score,
      this.windowDays,
      this.channel,
      this.bid,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a challenge digest in status open. */
export function newChallengeDigest(code: string, label: string): ChallengeDigest {
  return new ChallengeDigest(code, label, 0, 0, "", 0, 0, 0, "", 0, false, "open");
}
