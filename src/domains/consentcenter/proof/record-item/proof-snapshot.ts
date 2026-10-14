import * as text from "../../../../kit/text.js";

/** Where a proof snapshot is in its life cycle. */
export type ProofSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A proof snapshot as the proof team keeps it. */
export class ProofSnapshot {
  code: string;
  title: string;
  ceiling: number;
  bid: number;
  endsAt: number;
  status: ProofSnapshotStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    bid: number,
    endsAt: number,
    status: ProofSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.bid = bid;
    this.endsAt = endsAt;
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

  canMoveTo(next: ProofSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ProofSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedExposure(): number {
    return Math.round(this.bid * this.endsAt * 100) / 100;
  }

  copy(): ProofSnapshot {
    return new ProofSnapshot(this.code, this.title, this.ceiling, this.bid, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a proof snapshot in status open. */
export function newProofSnapshot(code: string, title: string): ProofSnapshot {
  return new ProofSnapshot(code, title, 0, 0, 0, "open");
}
