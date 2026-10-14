import * as text from "../../../../kit/text.js";

/** Where a strict nudge mapping is in its life cycle. */
export type StrictNudgeMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a strict nudge mapping and its current status. */
export class StrictNudgeMapping {
  code: string;
  name: string;
  capacity: number;
  locale: string;
  bid: number;
  checksum: string;
  attempts: number;
  openRate: number;
  expiresAt: number;
  unit: string;
  status: StrictNudgeMappingStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    locale: string,
    bid: number,
    checksum: string,
    attempts: number,
    openRate: number,
    expiresAt: number,
    unit: string,
    status: StrictNudgeMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.locale = locale;
    this.bid = bid;
    this.checksum = checksum;
    this.attempts = attempts;
    this.openRate = openRate;
    this.expiresAt = expiresAt;
    this.unit = unit;
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

  canMoveTo(next: StrictNudgeMappingStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictNudgeMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict nudge mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"strict nudge mapping"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.attempts * this.capacity * 100) / 100;
  }

  copy(): StrictNudgeMapping {
    return new StrictNudgeMapping(
      this.code,
      this.name,
      this.capacity,
      this.locale,
      this.bid,
      this.checksum,
      this.attempts,
      this.openRate,
      this.expiresAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict nudge mapping in status open. */
export function newStrictNudgeMapping(code: string, name: string): StrictNudgeMapping {
  return new StrictNudgeMapping(code, name, 0, "", 0, "", 0, 0, 0, "", "open");
}
