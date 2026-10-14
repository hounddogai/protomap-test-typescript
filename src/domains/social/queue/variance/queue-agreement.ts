import * as text from "../../../../kit/text.js";

/** Where a queue agreement is in its life cycle. */
export type QueueAgreementStatus = "created" | "validated" | "published" | "retired";

/** A queue agreement. Its code is unique within a tenant. */
export class QueueAgreement {
  code: string;
  label: string;
  discount: number;
  clicks: number;
  retries: number;
  status: QueueAgreementStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    clicks: number,
    retries: number,
    status: QueueAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.clicks = clicks;
    this.retries = retries;
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

  canMoveTo(next: QueueAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
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

  moveTo(next: QueueAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"queue agreement"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.discount - this.retries) * 100) / 100;
  }

  copy(): QueueAgreement {
    return new QueueAgreement(this.code, this.label, this.discount, this.clicks, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a queue agreement in status created. */
export function newQueueAgreement(code: string, label: string): QueueAgreement {
  return new QueueAgreement(code, label, 0, 0, 0, "created");
}
