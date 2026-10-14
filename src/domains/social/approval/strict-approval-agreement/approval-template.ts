import * as text from "../../../../kit/text.js";

/** Where a approval template is in its life cycle. */
export type ApprovalTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One approval template, with what the planners need to act on it. */
export class ApprovalTemplate {
  code: string;
  title: string;
  impressions: number;
  variant: string;
  externalRef: string;
  quantity: number;
  batchSize: number;
  currency: string;
  status: ApprovalTemplateStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    variant: string,
    externalRef: string,
    quantity: number,
    batchSize: number,
    currency: string,
    status: ApprovalTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.variant = variant;
    this.externalRef = externalRef;
    this.quantity = quantity;
    this.batchSize = batchSize;
    this.currency = currency;
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

  canMoveTo(next: ApprovalTemplateStatus): boolean {
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

  moveTo(next: ApprovalTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.quantity * this.batchSize * 100) / 100;
  }

  copy(): ApprovalTemplate {
    return new ApprovalTemplate(
      this.code,
      this.title,
      this.impressions,
      this.variant,
      this.externalRef,
      this.quantity,
      this.batchSize,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a approval template in status proposed. */
export function newApprovalTemplate(code: string, title: string): ApprovalTemplate {
  return new ApprovalTemplate(code, title, 0, "", "", 0, 0, "", "proposed");
}
