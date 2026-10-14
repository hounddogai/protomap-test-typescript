import * as text from "../../../../kit/text.js";

/** Where a legacy deflection claim is in its life cycle. */
export type LegacyDeflectionClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** One legacy deflection claim, with what the planners need to act on it. */
export class LegacyDeflectionClaim {
  code: string;
  label: string;
  notes: string;
  quantity: number;
  weight: number;
  status: LegacyDeflectionClaimStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    quantity: number,
    weight: number,
    status: LegacyDeflectionClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.quantity = quantity;
    this.weight = weight;
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

  canMoveTo(next: LegacyDeflectionClaimStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyDeflectionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy deflection claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.quantity * this.weight * 100) / 100;
  }

  copy(): LegacyDeflectionClaim {
    return new LegacyDeflectionClaim(this.code, this.label, this.notes, this.quantity, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy deflection claim in status new. */
export function newLegacyDeflectionClaim(code: string, label: string): LegacyDeflectionClaim {
  return new LegacyDeflectionClaim(code, label, "", 0, 0, "new");
}
