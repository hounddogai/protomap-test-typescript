import * as text from "../../../../kit/text.js";

/** Where a manual complaint agreement is in its life cycle. */
export type ManualComplaintAgreementStatus = "created" | "validated" | "published" | "retired";

/** The record of a manual complaint agreement and its current status. */
export class ManualComplaintAgreement {
  code: string;
  title: string;
  attempts: number;
  retries: number;
  sequence: number;
  discount: number;
  status: ManualComplaintAgreementStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    retries: number,
    sequence: number,
    discount: number,
    status: ManualComplaintAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.retries = retries;
    this.sequence = sequence;
    this.discount = discount;
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

  canMoveTo(next: ManualComplaintAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualComplaintAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual complaint agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.discount + this.retries) * 100) / 100;
  }

  copy(): ManualComplaintAgreement {
    return new ManualComplaintAgreement(
      this.code,
      this.title,
      this.attempts,
      this.retries,
      this.sequence,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual complaint agreement in status created. */
export function newManualComplaintAgreement(code: string, title: string): ManualComplaintAgreement {
  return new ManualComplaintAgreement(code, title, 0, 0, 0, 0, "created");
}
