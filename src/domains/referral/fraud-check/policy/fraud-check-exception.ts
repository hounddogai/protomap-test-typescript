import * as text from "../../../../kit/text.js";

/** Where a fraud check exception is in its life cycle. */
export type FraudCheckExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fraud check exception, with what the planners need to act on it. */
export class FraudCheckException {
  code: string;
  title: string;
  currency: string;
  source: string;
  createdAt: number;
  category: string;
  status: FraudCheckExceptionStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    source: string,
    createdAt: number,
    category: string,
    status: FraudCheckExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.source = source;
    this.createdAt = createdAt;
    this.category = category;
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

  canMoveTo(next: FraudCheckExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: FraudCheckExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): FraudCheckException {
    return new FraudCheckException(
      this.code,
      this.title,
      this.currency,
      this.source,
      this.createdAt,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fraud check exception in status proposed. */
export function newFraudCheckException(code: string, title: string): FraudCheckException {
  return new FraudCheckException(code, title, "", "", 0, "", "proposed");
}
