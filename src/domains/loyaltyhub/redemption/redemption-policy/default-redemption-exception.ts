import * as text from "../../../../kit/text.js";

/** Where a default redemption exception is in its life cycle. */
export type DefaultRedemptionExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A default redemption exception. Its code is unique within a tenant. */
export class DefaultRedemptionException {
  code: string;
  label: string;
  locale: string;
  minimum: number;
  externalRef: string;
  cost: number;
  active: boolean;
  sendAt: number;
  status: DefaultRedemptionExceptionStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    minimum: number,
    externalRef: string,
    cost: number,
    active: boolean,
    sendAt: number,
    status: DefaultRedemptionExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.minimum = minimum;
    this.externalRef = externalRef;
    this.cost = cost;
    this.active = active;
    this.sendAt = sendAt;
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

  canMoveTo(next: DefaultRedemptionExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultRedemptionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default redemption exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.minimum + this.sendAt) * 100) / 100;
  }

  copy(): DefaultRedemptionException {
    return new DefaultRedemptionException(
      this.code,
      this.label,
      this.locale,
      this.minimum,
      this.externalRef,
      this.cost,
      this.active,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default redemption exception in status idle. */
export function newDefaultRedemptionException(code: string, label: string): DefaultRedemptionException {
  return new DefaultRedemptionException(code, label, "", 0, "", 0, false, 0, "idle");
}
