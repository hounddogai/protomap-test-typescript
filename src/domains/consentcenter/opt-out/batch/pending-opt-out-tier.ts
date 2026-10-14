import * as text from "../../../../kit/text.js";

/** Where a pending opt out tier is in its life cycle. */
export type PendingOptOutTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending opt out tier and its current status. */
export class PendingOptOutTier {
  code: string;
  name: string;
  unit: string;
  attempts: number;
  batchSize: number;
  margin: number;
  sequence: number;
  startsAt: number;
  priority: number;
  score: number;
  clicks: number;
  status: PendingOptOutTierStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    attempts: number,
    batchSize: number,
    margin: number,
    sequence: number,
    startsAt: number,
    priority: number,
    score: number,
    clicks: number,
    status: PendingOptOutTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.attempts = attempts;
    this.batchSize = batchSize;
    this.margin = margin;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.priority = priority;
    this.score = score;
    this.clicks = clicks;
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

  canMoveTo(next: PendingOptOutTierStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingOptOutTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending opt out tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.priority + this.startsAt) * 100) / 100;
  }

  copy(): PendingOptOutTier {
    return new PendingOptOutTier(
      this.code,
      this.name,
      this.unit,
      this.attempts,
      this.batchSize,
      this.margin,
      this.sequence,
      this.startsAt,
      this.priority,
      this.score,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending opt out tier in status open. */
export function newPendingOptOutTier(code: string, name: string): PendingOptOutTier {
  return new PendingOptOutTier(code, name, "", 0, 0, 0, 0, 0, 0, 0, 0, "open");
}
