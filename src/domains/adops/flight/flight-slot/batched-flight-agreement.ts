import * as text from "../../../../kit/text.js";

/** Where a batched flight agreement is in its life cycle. */
export type BatchedFlightAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched flight agreement as the flight team keeps it. */
export class BatchedFlightAgreement {
  code: string;
  name: string;
  notes: string;
  contactEmail: string;
  batchSize: number;
  status: BatchedFlightAgreementStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    contactEmail: string,
    batchSize: number,
    status: BatchedFlightAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
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

  canMoveTo(next: BatchedFlightAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedFlightAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched flight agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): BatchedFlightAgreement {
    return new BatchedFlightAgreement(this.code, this.name, this.notes, this.contactEmail, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched flight agreement in status open. */
export function newBatchedFlightAgreement(code: string, name: string): BatchedFlightAgreement {
  return new BatchedFlightAgreement(code, name, "", "", 0, "open");
}
