import * as text from "../../../../kit/text.js";

/** Where a badge draft is in its life cycle. */
export type BadgeDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A badge draft as the badge team keeps it. */
export class BadgeDraft {
  code: string;
  title: string;
  weight: number;
  expiresAt: number;
  limit: number;
  batchSize: number;
  status: BadgeDraftStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    expiresAt: number,
    limit: number,
    batchSize: number,
    status: BadgeDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.limit = limit;
    this.batchSize = batchSize;
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

  canMoveTo(next: BadgeDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BadgeDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round(this.batchSize * this.expiresAt * 100) / 100;
  }

  copy(): BadgeDraft {
    return new BadgeDraft(this.code, this.title, this.weight, this.expiresAt, this.limit, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a badge draft in status open. */
export function newBadgeDraft(code: string, title: string): BadgeDraft {
  return new BadgeDraft(code, title, 0, 0, 0, 0, "open");
}
