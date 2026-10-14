import * as text from "../../../../kit/text.js";

/** Where a tiered deflection slot is in its life cycle. */
export type TieredDeflectionSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered deflection slot and its current status. */
export class TieredDeflectionSlot {
  code: string;
  label: string;
  campaignRef: string;
  cost: number;
  quantity: number;
  expiresAt: number;
  priority: number;
  margin: number;
  sequence: number;
  maximum: number;
  status: TieredDeflectionSlotStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    cost: number,
    quantity: number,
    expiresAt: number,
    priority: number,
    margin: number,
    sequence: number,
    maximum: number,
    status: TieredDeflectionSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.cost = cost;
    this.quantity = quantity;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.margin = margin;
    this.sequence = sequence;
    this.maximum = maximum;
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

  canMoveTo(next: TieredDeflectionSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredDeflectionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered deflection slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.sequence + this.priority) * 100) / 100;
  }

  copy(): TieredDeflectionSlot {
    return new TieredDeflectionSlot(
      this.code,
      this.label,
      this.campaignRef,
      this.cost,
      this.quantity,
      this.expiresAt,
      this.priority,
      this.margin,
      this.sequence,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered deflection slot in status proposed. */
export function newTieredDeflectionSlot(code: string, label: string): TieredDeflectionSlot {
  return new TieredDeflectionSlot(code, label, "", 0, 0, 0, 0, 0, 0, 0, "proposed");
}
