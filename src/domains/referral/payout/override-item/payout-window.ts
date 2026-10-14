import * as text from "../../../../kit/text.js";

/** Where a payout window is in its life cycle. */
export type PayoutWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One payout window, with what the planners need to act on it. */
export class PayoutWindow {
  code: string;
  name: string;
  revision: number;
  frequencyCap: number;
  sendAt: number;
  maximum: number;
  summary: string;
  quantity: number;
  score: number;
  discount: number;
  limit: number;
  status: PayoutWindowStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    frequencyCap: number,
    sendAt: number,
    maximum: number,
    summary: string,
    quantity: number,
    score: number,
    discount: number,
    limit: number,
    status: PayoutWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.sendAt = sendAt;
    this.maximum = maximum;
    this.summary = summary;
    this.quantity = quantity;
    this.score = score;
    this.discount = discount;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round(this.discount * this.score * 100) / 100;
  }

  copy(): PayoutWindow {
    return new PayoutWindow(
      this.code,
      this.name,
      this.revision,
      this.frequencyCap,
      this.sendAt,
      this.maximum,
      this.summary,
      this.quantity,
      this.score,
      this.discount,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a payout window in status draft. */
export function newPayoutWindow(code: string, name: string): PayoutWindow {
  return new PayoutWindow(code, name, 0, 0, 0, 0, "", 0, 0, 0, 0, "draft");
}
