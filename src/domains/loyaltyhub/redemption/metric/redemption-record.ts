import * as text from "../../../../kit/text.js";

/** Where a redemption record is in its life cycle. */
export type RedemptionRecordStatus = "created" | "validated" | "published" | "retired";

/** A redemption record as the redemption team keeps it. */
export class RedemptionRecord {
  code: string;
  label: string;
  externalRef: string;
  margin: number;
  budget: number;
  ownerId: string;
  sequence: number;
  name: string;
  reviewer: string;
  status: RedemptionRecordStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    margin: number,
    budget: number,
    ownerId: string,
    sequence: number,
    name: string,
    reviewer: string,
    status: RedemptionRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.margin = margin;
    this.budget = budget;
    this.ownerId = ownerId;
    this.sequence = sequence;
    this.name = name;
    this.reviewer = reviewer;
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

  canMoveTo(next: RedemptionRecordStatus): boolean {
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

  moveTo(next: RedemptionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"redemption record"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.budget * this.sequence * 100) / 100;
  }

  copy(): RedemptionRecord {
    return new RedemptionRecord(
      this.code,
      this.label,
      this.externalRef,
      this.margin,
      this.budget,
      this.ownerId,
      this.sequence,
      this.name,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption record in status created. */
export function newRedemptionRecord(code: string, label: string): RedemptionRecord {
  return new RedemptionRecord(code, label, "", 0, 0, "", 0, "", "", "created");
}
