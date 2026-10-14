import * as text from "../../../../kit/text.js";

/** Where a capped enrollment request is in its life cycle. */
export type CappedEnrollmentRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a capped enrollment request and its current status. */
export class CappedEnrollmentRequest {
  code: string;
  title: string;
  sendAt: number;
  utmSource: string;
  name: string;
  discount: number;
  quantity: number;
  retries: number;
  status: CappedEnrollmentRequestStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    utmSource: string,
    name: string,
    discount: number,
    quantity: number,
    retries: number,
    status: CappedEnrollmentRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.name = name;
    this.discount = discount;
    this.quantity = quantity;
    this.retries = retries;
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

  canMoveTo(next: CappedEnrollmentRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedEnrollmentRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped enrollment request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.sendAt + this.quantity) * 100) / 100;
  }

  copy(): CappedEnrollmentRequest {
    return new CappedEnrollmentRequest(
      this.code,
      this.title,
      this.sendAt,
      this.utmSource,
      this.name,
      this.discount,
      this.quantity,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped enrollment request in status idle. */
export function newCappedEnrollmentRequest(code: string, title: string): CappedEnrollmentRequest {
  return new CappedEnrollmentRequest(code, title, 0, "", "", 0, 0, 0, "idle");
}
