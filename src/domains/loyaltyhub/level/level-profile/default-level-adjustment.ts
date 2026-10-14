import * as text from "../../../../kit/text.js";

/** Where a default level adjustment is in its life cycle. */
export type DefaultLevelAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a default level adjustment and its current status. */
export class DefaultLevelAdjustment {
  code: string;
  name: string;
  quantity: number;
  phone: string;
  conversionRate: number;
  status: DefaultLevelAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    phone: string,
    conversionRate: number,
    status: DefaultLevelAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultLevelAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultLevelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default level adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netValue(): number {
    return Math.round(this.conversionRate * this.quantity * 100) / 100;
  }

  copy(): DefaultLevelAdjustment {
    return new DefaultLevelAdjustment(
      this.code,
      this.name,
      this.quantity,
      this.phone,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default level adjustment in status open. */
export function newDefaultLevelAdjustment(code: string, name: string): DefaultLevelAdjustment {
  return new DefaultLevelAdjustment(code, name, 0, "", 0, "open");
}
