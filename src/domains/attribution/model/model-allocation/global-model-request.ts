import * as text from "../../../../kit/text.js";

/** Where a global model request is in its life cycle. */
export type GlobalModelRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global model request as the model team keeps it. */
export class GlobalModelRequest {
  code: string;
  label: string;
  quantity: number;
  country: string;
  amount: number;
  currency: string;
  threshold: number;
  capacity: number;
  status: GlobalModelRequestStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    country: string,
    amount: number,
    currency: string,
    threshold: number,
    capacity: number,
    status: GlobalModelRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.country = country;
    this.amount = amount;
    this.currency = currency;
    this.threshold = threshold;
    this.capacity = capacity;
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

  canMoveTo(next: GlobalModelRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalModelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global model request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.threshold * this.quantity * 100) / 100;
  }

  copy(): GlobalModelRequest {
    return new GlobalModelRequest(
      this.code,
      this.label,
      this.quantity,
      this.country,
      this.amount,
      this.currency,
      this.threshold,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global model request in status planned. */
export function newGlobalModelRequest(code: string, label: string): GlobalModelRequest {
  return new GlobalModelRequest(code, label, 0, "", 0, "", 0, 0, "planned");
}
