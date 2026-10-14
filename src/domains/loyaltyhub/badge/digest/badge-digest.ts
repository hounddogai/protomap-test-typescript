/**
 * The badge digest records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge digest is in its life cycle. */
export type BadgeDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A badge digest. Its code is unique within a tenant. */
export class BadgeDigest {
  code: string;
  title: string;
  batchSize: number;
  summary: string;
  locale: string;
  cost: number;
  visible: boolean;
  score: number;
  unit: string;
  checksum: string;
  status: BadgeDigestStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    summary: string,
    locale: string,
    cost: number,
    visible: boolean,
    score: number,
    unit: string,
    checksum: string,
    status: BadgeDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.summary = summary;
    this.locale = locale;
    this.cost = cost;
    this.visible = visible;
    this.score = score;
    this.unit = unit;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.cost - this.batchSize) * 100) / 100;
  }

  copy(): BadgeDigest {
    return new BadgeDigest(
      this.code,
      this.title,
      this.batchSize,
      this.summary,
      this.locale,
      this.cost,
      this.visible,
      this.score,
      this.unit,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a badge digest in status planned. */
export function newBadgeDigest(code: string, title: string): BadgeDigest {
  return new BadgeDigest(code, title, 0, "", "", 0, false, 0, "", "", "planned");
}
