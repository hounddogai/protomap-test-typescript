import * as text from "../../../../kit/text.js";

/** Where a challenge score is in its life cycle. */
export type ChallengeScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** A challenge score as the challenge team keeps it. */
export class ChallengeScore {
  code: string;
  name: string;
  minimum: number;
  openRate: number;
  endsAt: number;
  title: string;
  retries: number;
  version: number;
  batchSize: number;
  region: string;
  contactEmail: string;
  status: ChallengeScoreStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    openRate: number,
    endsAt: number,
    title: string,
    retries: number,
    version: number,
    batchSize: number,
    region: string,
    contactEmail: string,
    status: ChallengeScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.openRate = openRate;
    this.endsAt = endsAt;
    this.title = title;
    this.retries = retries;
    this.version = version;
    this.batchSize = batchSize;
    this.region = region;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: ChallengeScoreStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ChallengeScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"challenge score"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.batchSize * this.minimum * 100) / 100;
  }

  copy(): ChallengeScore {
    return new ChallengeScore(
      this.code,
      this.name,
      this.minimum,
      this.openRate,
      this.endsAt,
      this.title,
      this.retries,
      this.version,
      this.batchSize,
      this.region,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a challenge score in status new. */
export function newChallengeScore(code: string, name: string): ChallengeScore {
  return new ChallengeScore(code, name, 0, 0, 0, "", 0, 0, 0, "", "", "new");
}
