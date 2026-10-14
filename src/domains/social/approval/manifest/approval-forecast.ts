import * as text from "../../../../kit/text.js";

/** Where a approval forecast is in its life cycle. */
export type ApprovalForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A approval forecast. Its code is unique within a tenant. */
export class ApprovalForecast {
  code: string;
  name: string;
  amount: number;
  revision: number;
  score: number;
  ceiling: number;
  graceDays: number;
  status: ApprovalForecastStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    revision: number,
    score: number,
    ceiling: number,
    graceDays: number,
    status: ApprovalForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.revision = revision;
    this.score = score;
    this.ceiling = ceiling;
    this.graceDays = graceDays;
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

  canMoveTo(next: ApprovalForecastStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ApprovalForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"approval forecast"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.revision + this.score) * 100) / 100;
  }

  copy(): ApprovalForecast {
    return new ApprovalForecast(
      this.code,
      this.name,
      this.amount,
      this.revision,
      this.score,
      this.ceiling,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval forecast in status open. */
export function newApprovalForecast(code: string, name: string): ApprovalForecast {
  return new ApprovalForecast(code, name, 0, 0, 0, 0, 0, "open");
}
