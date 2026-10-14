import * as text from "../../../../kit/text.js";

/** Where a deflection claim is in its life cycle. */
export type DeflectionClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A deflection claim as the deflection team keeps it. */
export class DeflectionClaim {
  code: string;
  title: string;
  category: string;
  label: string;
  notes: string;
  amount: number;
  status: DeflectionClaimStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    label: string,
    notes: string,
    amount: number,
    status: DeflectionClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.label = label;
    this.notes = notes;
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

  canMoveTo(next: DeflectionClaimStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"deflection claim"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): DeflectionClaim {
    return new DeflectionClaim(this.code, this.title, this.category, this.label, this.notes, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a deflection claim in status new. */
export function newDeflectionClaim(code: string, title: string): DeflectionClaim {
  return new DeflectionClaim(code, title, "", "", "", 0, "new");
}
