import * as text from "../../../../kit/text.js";

/** Where a suppression ledger is in its life cycle. */
export type SuppressionLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression ledger. Its code is unique within a tenant. */
export class SuppressionLedger {
  code: string;
  label: string;
  phone: string;
  quantity: number;
  externalRef: string;
  maximum: number;
  limit: number;
  clicks: number;
  updatedAt: number;
  status: SuppressionLedgerStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    quantity: number,
    externalRef: string,
    maximum: number,
    limit: number,
    clicks: number,
    updatedAt: number,
    status: SuppressionLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.quantity = quantity;
    this.externalRef = externalRef;
    this.maximum = maximum;
    this.limit = limit;
    this.clicks = clicks;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SuppressionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.clicks + this.limit) * 100) / 100;
  }

  copy(): SuppressionLedger {
    return new SuppressionLedger(
      this.code,
      this.label,
      this.phone,
      this.quantity,
      this.externalRef,
      this.maximum,
      this.limit,
      this.clicks,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression ledger in status planned. */
export function newSuppressionLedger(code: string, label: string): SuppressionLedger {
  return new SuppressionLedger(code, label, "", 0, "", 0, 0, 0, 0, "planned");
}
