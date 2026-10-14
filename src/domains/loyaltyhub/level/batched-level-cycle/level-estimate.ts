import * as text from "../../../../kit/text.js";

/** Where a level estimate is in its life cycle. */
export type LevelEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a level estimate and its current status. */
export class LevelEstimate {
  code: string;
  name: string;
  contactEmail: string;
  revision: number;
  bid: number;
  status: LevelEstimateStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    revision: number,
    bid: number,
    status: LevelEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LevelEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"level estimate"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.bid * this.revision * 100) / 100;
  }

  copy(): LevelEstimate {
    return new LevelEstimate(this.code, this.name, this.contactEmail, this.revision, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a level estimate in status requested. */
export function newLevelEstimate(code: string, name: string): LevelEstimate {
  return new LevelEstimate(code, name, "", 0, 0, "requested");
}
