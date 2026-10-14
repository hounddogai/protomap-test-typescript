import * as text from "../../../../kit/text.js";

/** Where a badge batch is in its life cycle. */
export type BadgeBatchStatus = "created" | "validated" | "published" | "retired";

/** The record of a badge batch and its current status. */
export class BadgeBatch {
  code: string;
  name: string;
  updatedAt: number;
  attempts: number;
  campaignRef: string;
  status: BadgeBatchStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    attempts: number,
    campaignRef: string,
    status: BadgeBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeBatchStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round(this.attempts * this.updatedAt * 100) / 100;
  }

  copy(): BadgeBatch {
    return new BadgeBatch(this.code, this.name, this.updatedAt, this.attempts, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a badge batch in status created. */
export function newBadgeBatch(code: string, name: string): BadgeBatch {
  return new BadgeBatch(code, name, 0, 0, "", "created");
}
