/**
 * The path record records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path record is in its life cycle. */
export type PathRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A path record as the path team keeps it. */
export class PathRecord {
  code: string;
  name: string;
  phone: string;
  reviewer: string;
  journeyId: string;
  segment: string;
  score: number;
  status: PathRecordStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    reviewer: string,
    journeyId: string,
    segment: string,
    score: number,
    status: PathRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.reviewer = reviewer;
    this.journeyId = journeyId;
    this.segment = segment;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PathRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PathRecord {
    return new PathRecord(
      this.code,
      this.name,
      this.phone,
      this.reviewer,
      this.journeyId,
      this.segment,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a path record in status draft. */
export function newPathRecord(code: string, name: string): PathRecord {
  return new PathRecord(code, name, "", "", "", "", 0, "draft");
}
