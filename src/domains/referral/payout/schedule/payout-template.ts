import * as text from "../../../../kit/text.js";

/** Where a payout template is in its life cycle. */
export type PayoutTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A payout template as the payout team keeps it. */
export class PayoutTemplate {
  code: string;
  label: string;
  ownerId: string;
  revision: number;
  expiresAt: number;
  openRate: number;
  category: string;
  status: PayoutTemplateStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    revision: number,
    expiresAt: number,
    openRate: number,
    category: string,
    status: PayoutTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.revision = revision;
    this.expiresAt = expiresAt;
    this.openRate = openRate;
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

  canMoveTo(next: PayoutTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"payout template"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.expiresAt + this.openRate) * 100) / 100;
  }

  copy(): PayoutTemplate {
    return new PayoutTemplate(
      this.code,
      this.label,
      this.ownerId,
      this.revision,
      this.expiresAt,
      this.openRate,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a payout template in status proposed. */
export function newPayoutTemplate(code: string, label: string): PayoutTemplate {
  return new PayoutTemplate(code, label, "", 0, 0, 0, "", "proposed");
}
