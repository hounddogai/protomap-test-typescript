import * as text from "../../../../kit/text.js";

/** Where a tiered sender profile is in its life cycle. */
export type TieredSenderProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered sender profile. Its code is unique within a tenant. */
export class TieredSenderProfile {
  code: string;
  name: string;
  attempts: number;
  journeyId: string;
  version: number;
  status: TieredSenderProfileStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    journeyId: string,
    version: number,
    status: TieredSenderProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.journeyId = journeyId;
    this.version = version;
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

  canMoveTo(next: TieredSenderProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredSenderProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered sender profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.version + this.attempts) * 100) / 100;
  }

  copy(): TieredSenderProfile {
    return new TieredSenderProfile(this.code, this.name, this.attempts, this.journeyId, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered sender profile in status proposed. */
export function newTieredSenderProfile(code: string, name: string): TieredSenderProfile {
  return new TieredSenderProfile(code, name, 0, "", 0, "proposed");
}
