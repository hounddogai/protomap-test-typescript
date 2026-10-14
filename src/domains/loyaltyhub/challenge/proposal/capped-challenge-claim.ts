import * as text from "../../../../kit/text.js";

/** Where a capped challenge claim is in its life cycle. */
export type CappedChallengeClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** One capped challenge claim, with what the planners need to act on it. */
export class CappedChallengeClaim {
  code: string;
  name: string;
  country: string;
  score: number;
  checksum: string;
  currency: string;
  label: string;
  expiresAt: number;
  sendAt: number;
  unit: string;
  status: CappedChallengeClaimStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    score: number,
    checksum: string,
    currency: string,
    label: string,
    expiresAt: number,
    sendAt: number,
    unit: string,
    status: CappedChallengeClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.score = score;
    this.checksum = checksum;
    this.currency = currency;
    this.label = label;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedChallengeClaimStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedChallengeClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped challenge claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"capped challenge claim"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.score - this.expiresAt) * 100) / 100;
  }

  copy(): CappedChallengeClaim {
    return new CappedChallengeClaim(
      this.code,
      this.name,
      this.country,
      this.score,
      this.checksum,
      this.currency,
      this.label,
      this.expiresAt,
      this.sendAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a capped challenge claim in status new. */
export function newCappedChallengeClaim(code: string, name: string): CappedChallengeClaim {
  return new CappedChallengeClaim(code, name, "", 0, "", "", "", 0, 0, "", "new");
}
