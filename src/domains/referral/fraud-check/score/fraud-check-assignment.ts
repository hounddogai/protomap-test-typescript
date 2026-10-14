import * as text from "../../../../kit/text.js";

/** Where a fraud check assignment is in its life cycle. */
export type FraudCheckAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fraud check assignment as the fraud check team keeps it. */
export class FraudCheckAssignment {
  code: string;
  title: string;
  name: string;
  phone: string;
  ownerId: string;
  currency: string;
  segment: string;
  conversionRate: number;
  externalRef: string;
  maximum: number;
  status: FraudCheckAssignmentStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    phone: string,
    ownerId: string,
    currency: string,
    segment: string,
    conversionRate: number,
    externalRef: string,
    maximum: number,
    status: FraudCheckAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.phone = phone;
    this.ownerId = ownerId;
    this.currency = currency;
    this.segment = segment;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
    this.maximum = maximum;
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

  canMoveTo(next: FraudCheckAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FraudCheckAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.maximum + this.conversionRate) * 100) / 100;
  }

  copy(): FraudCheckAssignment {
    return new FraudCheckAssignment(
      this.code,
      this.title,
      this.name,
      this.phone,
      this.ownerId,
      this.currency,
      this.segment,
      this.conversionRate,
      this.externalRef,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fraud check assignment in status planned. */
export function newFraudCheckAssignment(code: string, title: string): FraudCheckAssignment {
  return new FraudCheckAssignment(code, title, "", "", "", "", "", 0, "", 0, "planned");
}
