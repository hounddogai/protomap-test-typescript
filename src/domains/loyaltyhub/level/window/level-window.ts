/**
 * The level window records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level window is in its life cycle. */
export type LevelWindowStatus = "created" | "validated" | "published" | "retired";

/** A level window. Its code is unique within a tenant. */
export class LevelWindow {
  code: string;
  name: string;
  unit: string;
  reviewer: string;
  source: string;
  campaignRef: string;
  externalRef: string;
  expiresAt: number;
  score: number;
  status: LevelWindowStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    reviewer: string,
    source: string,
    campaignRef: string,
    externalRef: string,
    expiresAt: number,
    score: number,
    status: LevelWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.reviewer = reviewer;
    this.source = source;
    this.campaignRef = campaignRef;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.score = score;
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

  canMoveTo(next: LevelWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LevelWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.expiresAt + this.score) * 100) / 100;
  }

  copy(): LevelWindow {
    return new LevelWindow(
      this.code,
      this.name,
      this.unit,
      this.reviewer,
      this.source,
      this.campaignRef,
      this.externalRef,
      this.expiresAt,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a level window in status created. */
export function newLevelWindow(code: string, name: string): LevelWindow {
  return new LevelWindow(code, name, "", "", "", "", "", 0, 0, "created");
}
