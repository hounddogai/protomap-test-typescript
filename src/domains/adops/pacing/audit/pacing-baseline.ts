import * as text from "../../../../kit/text.js";

/** Where a pacing baseline is in its life cycle. */
export type PacingBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a pacing baseline and its current status. */
export class PacingBaseline {
  code: string;
  title: string;
  notes: string;
  description: string;
  version: number;
  attempts: number;
  createdAt: number;
  journeyId: string;
  status: PacingBaselineStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    description: string,
    version: number,
    attempts: number,
    createdAt: number,
    journeyId: string,
    status: PacingBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.description = description;
    this.version = version;
    this.attempts = attempts;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
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

  canMoveTo(next: PacingBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.createdAt + this.attempts) * 100) / 100;
  }

  copy(): PacingBaseline {
    return new PacingBaseline(
      this.code,
      this.title,
      this.notes,
      this.description,
      this.version,
      this.attempts,
      this.createdAt,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pacing baseline in status requested. */
export function newPacingBaseline(code: string, title: string): PacingBaseline {
  return new PacingBaseline(code, title, "", "", 0, 0, 0, "", "requested");
}
