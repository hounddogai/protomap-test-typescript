import * as text from "../../../../kit/text.js";

/** Where a batched funnel agreement is in its life cycle. */
export type BatchedFunnelAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched funnel agreement as the funnel team keeps it. */
export class BatchedFunnelAgreement {
  code: string;
  title: string;
  sequence: number;
  currency: string;
  contactEmail: string;
  status: BatchedFunnelAgreementStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    currency: string,
    contactEmail: string,
    status: BatchedFunnelAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.currency = currency;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: BatchedFunnelAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedFunnelAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched funnel agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): BatchedFunnelAgreement {
    return new BatchedFunnelAgreement(
      this.code,
      this.title,
      this.sequence,
      this.currency,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched funnel agreement in status new. */
export function newBatchedFunnelAgreement(code: string, title: string): BatchedFunnelAgreement {
  return new BatchedFunnelAgreement(code, title, 0, "", "", "new");
}
