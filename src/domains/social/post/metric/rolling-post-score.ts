import * as text from "../../../../kit/text.js";

/** Where a rolling post score is in its life cycle. */
export type RollingPostScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One rolling post score, with what the planners need to act on it. */
export class RollingPostScore {
  code: string;
  title: string;
  openRate: number;
  currency: string;
  threshold: number;
  capacity: number;
  description: string;
  revision: number;
  expiresAt: number;
  status: RollingPostScoreStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    currency: string,
    threshold: number,
    capacity: number,
    description: string,
    revision: number,
    expiresAt: number,
    status: RollingPostScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.currency = currency;
    this.threshold = threshold;
    this.capacity = capacity;
    this.description = description;
    this.revision = revision;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: RollingPostScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPostScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling post score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"rolling post score"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.revision - this.expiresAt) * 100) / 100;
  }

  copy(): RollingPostScore {
    return new RollingPostScore(
      this.code,
      this.title,
      this.openRate,
      this.currency,
      this.threshold,
      this.capacity,
      this.description,
      this.revision,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling post score in status open. */
export function newRollingPostScore(code: string, title: string): RollingPostScore {
  return new RollingPostScore(code, title, 0, "", 0, 0, "", 0, 0, "open");
}
