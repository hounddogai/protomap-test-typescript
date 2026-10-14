import * as text from "../../../../kit/text.js";

/** Where a payout audit is in its life cycle. */
export type PayoutAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A payout audit. Its code is unique within a tenant. */
export class PayoutAudit {
  code: string;
  name: string;
  title: string;
  pinned: boolean;
  audienceId: string;
  approved: boolean;
  campaignRef: string;
  quantity: number;
  status: PayoutAuditStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    pinned: boolean,
    audienceId: string,
    approved: boolean,
    campaignRef: string,
    quantity: number,
    status: PayoutAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
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

  canMoveTo(next: PayoutAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PayoutAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"payout audit"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): PayoutAudit {
    return new PayoutAudit(
      this.code,
      this.name,
      this.title,
      this.pinned,
      this.audienceId,
      this.approved,
      this.campaignRef,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a payout audit in status proposed. */
export function newPayoutAudit(code: string, name: string): PayoutAudit {
  return new PayoutAudit(code, name, "", false, "", false, "", 0, "proposed");
}
