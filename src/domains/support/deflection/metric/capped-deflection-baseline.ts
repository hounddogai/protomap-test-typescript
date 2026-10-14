import * as text from "../../../../kit/text.js";

/** Where a capped deflection baseline is in its life cycle. */
export type CappedDeflectionBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped deflection baseline. Its code is unique within a tenant. */
export class CappedDeflectionBaseline {
  code: string;
  label: string;
  currency: string;
  discount: number;
  openRate: number;
  status: CappedDeflectionBaselineStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    discount: number,
    openRate: number,
    status: CappedDeflectionBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.discount = discount;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedDeflectionBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedDeflectionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped deflection baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.discount - this.openRate) * 100) / 100;
  }

  copy(): CappedDeflectionBaseline {
    return new CappedDeflectionBaseline(
      this.code,
      this.label,
      this.currency,
      this.discount,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped deflection baseline in status idle. */
export function newCappedDeflectionBaseline(code: string, label: string): CappedDeflectionBaseline {
  return new CappedDeflectionBaseline(code, label, "", 0, 0, "idle");
}
