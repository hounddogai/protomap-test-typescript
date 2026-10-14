import * as text from "../../../../kit/text.js";

/** Where a branch ledger is in its life cycle. */
export type BranchLedgerStatus = "created" | "validated" | "published" | "retired";

/** One branch ledger, with what the planners need to act on it. */
export class BranchLedger {
  code: string;
  title: string;
  revision: number;
  margin: number;
  label: string;
  description: string;
  segment: string;
  status: BranchLedgerStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    margin: number,
    label: string,
    description: string,
    segment: string,
    status: BranchLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.margin = margin;
    this.label = label;
    this.description = description;
    this.segment = segment;
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

  canMoveTo(next: BranchLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
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

  moveTo(next: BranchLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.margin + this.revision) * 100) / 100;
  }

  copy(): BranchLedger {
    return new BranchLedger(
      this.code,
      this.title,
      this.revision,
      this.margin,
      this.label,
      this.description,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a branch ledger in status created. */
export function newBranchLedger(code: string, title: string): BranchLedger {
  return new BranchLedger(code, title, 0, 0, "", "", "", "created");
}
