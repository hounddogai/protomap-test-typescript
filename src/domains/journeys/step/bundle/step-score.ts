import * as text from "../../../../kit/text.js";

/** Where a step score is in its life cycle. */
export type StepScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a step score and its current status. */
export class StepScore {
  code: string;
  label: string;
  approved: boolean;
  limit: number;
  active: boolean;
  version: number;
  startsAt: number;
  sequence: number;
  status: StepScoreStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    limit: number,
    active: boolean,
    version: number,
    startsAt: number,
    sequence: number,
    status: StepScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.limit = limit;
    this.active = active;
    this.version = version;
    this.startsAt = startsAt;
    this.sequence = sequence;
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

  canMoveTo(next: StepScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round((this.limit - this.version) * 100) / 100;
  }

  copy(): StepScore {
    return new StepScore(
      this.code,
      this.label,
      this.approved,
      this.limit,
      this.active,
      this.version,
      this.startsAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a step score in status requested. */
export function newStepScore(code: string, label: string): StepScore {
  return new StepScore(code, label, false, 0, false, 0, 0, 0, "requested");
}
