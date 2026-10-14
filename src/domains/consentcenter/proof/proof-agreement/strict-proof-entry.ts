import * as text from "../../../../kit/text.js";

/** Where a strict proof entry is in its life cycle. */
export type StrictProofEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict proof entry and its current status. */
export class StrictProofEntry {
  code: string;
  name: string;
  variant: string;
  pinned: boolean;
  journeyId: string;
  amount: number;
  status: StrictProofEntryStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    pinned: boolean,
    journeyId: string,
    amount: number,
    status: StrictProofEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.pinned = pinned;
    this.journeyId = journeyId;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictProofEntryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictProofEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict proof entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): StrictProofEntry {
    return new StrictProofEntry(
      this.code,
      this.name,
      this.variant,
      this.pinned,
      this.journeyId,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict proof entry in status new. */
export function newStrictProofEntry(code: string, name: string): StrictProofEntry {
  return new StrictProofEntry(code, name, "", false, "", 0, "new");
}
