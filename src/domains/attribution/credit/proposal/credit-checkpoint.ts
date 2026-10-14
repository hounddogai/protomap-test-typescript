import * as text from "../../../../kit/text.js";

/** Where a credit checkpoint is in its life cycle. */
export type CreditCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** One credit checkpoint, with what the planners need to act on it. */
export class CreditCheckpoint {
  code: string;
  name: string;
  clicks: number;
  reviewer: string;
  currency: string;
  cohort: string;
  status: CreditCheckpointStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    reviewer: string,
    currency: string,
    cohort: string,
    status: CreditCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.reviewer = reviewer;
    this.currency = currency;
    this.cohort = cohort;
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

  canMoveTo(next: CreditCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): CreditCheckpoint {
    return new CreditCheckpoint(
      this.code,
      this.name,
      this.clicks,
      this.reviewer,
      this.currency,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a credit checkpoint in status new. */
export function newCreditCheckpoint(code: string, name: string): CreditCheckpoint {
  return new CreditCheckpoint(code, name, 0, "", "", "", "new");
}
