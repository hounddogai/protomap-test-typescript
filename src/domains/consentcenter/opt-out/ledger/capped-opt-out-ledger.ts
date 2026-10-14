import * as text from "../../../../kit/text.js";

/** Where a capped opt out ledger is in its life cycle. */
export type CappedOptOutLedgerStatus = "created" | "validated" | "published" | "retired";

/** One capped opt out ledger, with what the planners need to act on it. */
export class CappedOptOutLedger {
  code: string;
  label: string;
  externalRef: string;
  weight: number;
  startsAt: number;
  summary: string;
  category: string;
  score: number;
  status: CappedOptOutLedgerStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    weight: number,
    startsAt: number,
    summary: string,
    category: string,
    score: number,
    status: CappedOptOutLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.weight = weight;
    this.startsAt = startsAt;
    this.summary = summary;
    this.category = category;
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

  canMoveTo(next: CappedOptOutLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedOptOutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped opt out ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round(this.score * this.weight * 100) / 100;
  }

  copy(): CappedOptOutLedger {
    return new CappedOptOutLedger(
      this.code,
      this.label,
      this.externalRef,
      this.weight,
      this.startsAt,
      this.summary,
      this.category,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped opt out ledger in status created. */
export function newCappedOptOutLedger(code: string, label: string): CappedOptOutLedger {
  return new CappedOptOutLedger(code, label, "", 0, 0, "", "", 0, "created");
}
