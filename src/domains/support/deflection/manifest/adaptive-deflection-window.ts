import * as text from "../../../../kit/text.js";

/** Where a adaptive deflection window is in its life cycle. */
export type AdaptiveDeflectionWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a adaptive deflection window and its current status. */
export class AdaptiveDeflectionWindow {
  code: string;
  title: string;
  phone: string;
  cost: number;
  name: string;
  externalRef: string;
  batchSize: number;
  amount: number;
  checksum: string;
  status: AdaptiveDeflectionWindowStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    cost: number,
    name: string,
    externalRef: string,
    batchSize: number,
    amount: number,
    checksum: string,
    status: AdaptiveDeflectionWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.cost = cost;
    this.name = name;
    this.externalRef = externalRef;
    this.batchSize = batchSize;
    this.amount = amount;
    this.checksum = checksum;
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

  canMoveTo(next: AdaptiveDeflectionWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveDeflectionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive deflection window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.amount - this.batchSize) * 100) / 100;
  }

  copy(): AdaptiveDeflectionWindow {
    return new AdaptiveDeflectionWindow(
      this.code,
      this.title,
      this.phone,
      this.cost,
      this.name,
      this.externalRef,
      this.batchSize,
      this.amount,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive deflection window in status open. */
export function newAdaptiveDeflectionWindow(code: string, title: string): AdaptiveDeflectionWindow {
  return new AdaptiveDeflectionWindow(code, title, "", 0, "", "", 0, 0, "", "open");
}
