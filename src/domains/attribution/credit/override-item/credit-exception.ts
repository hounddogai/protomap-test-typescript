import * as text from "../../../../kit/text.js";

/** Where a credit exception is in its life cycle. */
export type CreditExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a credit exception and its current status. */
export class CreditException {
  code: string;
  title: string;
  windowDays: number;
  checksum: string;
  startsAt: number;
  variant: string;
  status: CreditExceptionStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    checksum: string,
    startsAt: number,
    variant: string,
    status: CreditExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.startsAt = startsAt;
    this.variant = variant;
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

  canMoveTo(next: CreditExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CreditExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.windowDays + this.startsAt) * 100) / 100;
  }

  copy(): CreditException {
    return new CreditException(
      this.code,
      this.title,
      this.windowDays,
      this.checksum,
      this.startsAt,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a credit exception in status new. */
export function newCreditException(code: string, title: string): CreditException {
  return new CreditException(code, title, 0, "", 0, "", "new");
}
