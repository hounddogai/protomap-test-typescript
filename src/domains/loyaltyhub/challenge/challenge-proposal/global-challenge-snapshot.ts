import * as text from "../../../../kit/text.js";

/** Where a global challenge snapshot is in its life cycle. */
export type GlobalChallengeSnapshotStatus = "created" | "validated" | "published" | "retired";

/** The record of a global challenge snapshot and its current status. */
export class GlobalChallengeSnapshot {
  code: string;
  name: string;
  bid: number;
  country: string;
  margin: number;
  startsAt: number;
  unit: string;
  status: GlobalChallengeSnapshotStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    country: string,
    margin: number,
    startsAt: number,
    unit: string,
    status: GlobalChallengeSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.country = country;
    this.margin = margin;
    this.startsAt = startsAt;
    this.unit = unit;
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

  canMoveTo(next: GlobalChallengeSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: GlobalChallengeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global challenge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.margin * this.bid * 100) / 100;
  }

  copy(): GlobalChallengeSnapshot {
    return new GlobalChallengeSnapshot(
      this.code,
      this.name,
      this.bid,
      this.country,
      this.margin,
      this.startsAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global challenge snapshot in status created. */
export function newGlobalChallengeSnapshot(code: string, name: string): GlobalChallengeSnapshot {
  return new GlobalChallengeSnapshot(code, name, 0, "", 0, 0, "", "created");
}
