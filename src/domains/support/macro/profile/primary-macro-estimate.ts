import * as text from "../../../../kit/text.js";

/** Where a primary macro estimate is in its life cycle. */
export type PrimaryMacroEstimateStatus = "created" | "validated" | "published" | "retired";

/** The record of a primary macro estimate and its current status. */
export class PrimaryMacroEstimate {
  code: string;
  name: string;
  revision: number;
  notes: string;
  endsAt: number;
  status: PrimaryMacroEstimateStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    notes: string,
    endsAt: number,
    status: PrimaryMacroEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.notes = notes;
    this.endsAt = endsAt;
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

  canMoveTo(next: PrimaryMacroEstimateStatus): boolean {
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryMacroEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary macro estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round((this.endsAt + this.revision) * 100) / 100;
  }

  copy(): PrimaryMacroEstimate {
    return new PrimaryMacroEstimate(this.code, this.name, this.revision, this.notes, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary macro estimate in status created. */
export function newPrimaryMacroEstimate(code: string, name: string): PrimaryMacroEstimate {
  return new PrimaryMacroEstimate(code, name, 0, "", 0, "created");
}
