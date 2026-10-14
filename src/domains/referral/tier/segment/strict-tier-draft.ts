import * as text from "../../../../kit/text.js";

/** Where a strict tier draft is in its life cycle. */
export type StrictTierDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A strict tier draft as the tier team keeps it. */
export class StrictTierDraft {
  code: string;
  name: string;
  sequence: number;
  amount: number;
  notes: string;
  minimum: number;
  weight: number;
  description: string;
  visible: boolean;
  status: StrictTierDraftStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    amount: number,
    notes: string,
    minimum: number,
    weight: number,
    description: string,
    visible: boolean,
    status: StrictTierDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.amount = amount;
    this.notes = notes;
    this.minimum = minimum;
    this.weight = weight;
    this.description = description;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictTierDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictTierDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict tier draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict tier draft"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.sequence - this.minimum) * 100) / 100;
  }

  copy(): StrictTierDraft {
    return new StrictTierDraft(
      this.code,
      this.name,
      this.sequence,
      this.amount,
      this.notes,
      this.minimum,
      this.weight,
      this.description,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict tier draft in status proposed. */
export function newStrictTierDraft(code: string, name: string): StrictTierDraft {
  return new StrictTierDraft(code, name, 0, 0, "", 0, 0, "", false, "proposed");
}
