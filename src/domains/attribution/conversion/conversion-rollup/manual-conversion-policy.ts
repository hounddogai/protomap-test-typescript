import * as text from "../../../../kit/text.js";

/** Where a manual conversion policy is in its life cycle. */
export type ManualConversionPolicyStatus = "created" | "validated" | "published" | "retired";

/** A manual conversion policy. Its code is unique within a tenant. */
export class ManualConversionPolicy {
  code: string;
  label: string;
  reviewer: string;
  threshold: number;
  discount: number;
  budget: number;
  archived: boolean;
  floorValue: number;
  quantity: number;
  batchSize: number;
  conversionRate: number;
  status: ManualConversionPolicyStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    threshold: number,
    discount: number,
    budget: number,
    archived: boolean,
    floorValue: number,
    quantity: number,
    batchSize: number,
    conversionRate: number,
    status: ManualConversionPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.threshold = threshold;
    this.discount = discount;
    this.budget = budget;
    this.archived = archived;
    this.floorValue = floorValue;
    this.quantity = quantity;
    this.batchSize = batchSize;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: ManualConversionPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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

  moveTo(next: ManualConversionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual conversion policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round(this.budget * this.discount * 100) / 100;
  }

  copy(): ManualConversionPolicy {
    return new ManualConversionPolicy(
      this.code,
      this.label,
      this.reviewer,
      this.threshold,
      this.discount,
      this.budget,
      this.archived,
      this.floorValue,
      this.quantity,
      this.batchSize,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual conversion policy in status created. */
export function newManualConversionPolicy(code: string, label: string): ManualConversionPolicy {
  return new ManualConversionPolicy(code, label, "", 0, 0, 0, false, 0, 0, 0, 0, "created");
}
