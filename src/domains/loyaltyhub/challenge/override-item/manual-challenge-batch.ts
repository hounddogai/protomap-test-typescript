import * as text from "../../../../kit/text.js";

/** Where a manual challenge batch is in its life cycle. */
export type ManualChallengeBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One manual challenge batch, with what the planners need to act on it. */
export class ManualChallengeBatch {
  code: string;
  title: string;
  attempts: number;
  capacity: number;
  margin: number;
  amount: number;
  graceDays: number;
  updatedAt: number;
  revision: number;
  status: ManualChallengeBatchStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    capacity: number,
    margin: number,
    amount: number,
    graceDays: number,
    updatedAt: number,
    revision: number,
    status: ManualChallengeBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.capacity = capacity;
    this.margin = margin;
    this.amount = amount;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.revision = revision;
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

  canMoveTo(next: ManualChallengeBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualChallengeBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual challenge batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"manual challenge batch"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.updatedAt - this.capacity) * 100) / 100;
  }

  copy(): ManualChallengeBatch {
    return new ManualChallengeBatch(
      this.code,
      this.title,
      this.attempts,
      this.capacity,
      this.margin,
      this.amount,
      this.graceDays,
      this.updatedAt,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual challenge batch in status proposed. */
export function newManualChallengeBatch(code: string, title: string): ManualChallengeBatch {
  return new ManualChallengeBatch(code, title, 0, 0, 0, 0, 0, 0, 0, "proposed");
}
