import * as text from "../../../../kit/text.js";

/** Where a reputation batch is in its life cycle. */
export type ReputationBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reputation batch. Its code is unique within a tenant. */
export class ReputationBatch {
  code: string;
  name: string;
  approved: boolean;
  externalRef: string;
  summary: string;
  amount: number;
  status: ReputationBatchStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    externalRef: string,
    summary: string,
    amount: number,
    status: ReputationBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.externalRef = externalRef;
    this.summary = summary;
    this.amount = amount;
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

  canMoveTo(next: ReputationBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: ReputationBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reputation batch"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ReputationBatch {
    return new ReputationBatch(
      this.code,
      this.name,
      this.approved,
      this.externalRef,
      this.summary,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reputation batch in status proposed. */
export function newReputationBatch(code: string, name: string): ReputationBatch {
  return new ReputationBatch(code, name, false, "", "", 0, "proposed");
}
