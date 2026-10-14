import * as text from "../../../../kit/text.js";

/** Where a challenge record is in its life cycle. */
export type ChallengeRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A challenge record as the challenge team keeps it. */
export class ChallengeRecord {
  code: string;
  label: string;
  notes: string;
  discount: number;
  createdAt: number;
  minimum: number;
  budget: number;
  floorValue: number;
  reviewer: string;
  status: ChallengeRecordStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    discount: number,
    createdAt: number,
    minimum: number,
    budget: number,
    floorValue: number,
    reviewer: string,
    status: ChallengeRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.discount = discount;
    this.createdAt = createdAt;
    this.minimum = minimum;
    this.budget = budget;
    this.floorValue = floorValue;
    this.reviewer = reviewer;
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

  canMoveTo(next: ChallengeRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.minimum + this.discount) * 100) / 100;
  }

  copy(): ChallengeRecord {
    return new ChallengeRecord(
      this.code,
      this.label,
      this.notes,
      this.discount,
      this.createdAt,
      this.minimum,
      this.budget,
      this.floorValue,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a challenge record in status proposed. */
export function newChallengeRecord(code: string, label: string): ChallengeRecord {
  return new ChallengeRecord(code, label, "", 0, 0, 0, 0, 0, "", "proposed");
}
