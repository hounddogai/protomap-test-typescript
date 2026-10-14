import * as text from "../../../../kit/text.js";

/** Where a scheduled suppression estimate is in its life cycle. */
export type ScheduledSuppressionEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled suppression estimate as the suppression team keeps it. */
export class ScheduledSuppressionEstimate {
  code: string;
  name: string;
  pinned: boolean;
  ceiling: number;
  channel: string;
  quantity: number;
  externalRef: string;
  phone: string;
  status: ScheduledSuppressionEstimateStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    ceiling: number,
    channel: string,
    quantity: number,
    externalRef: string,
    phone: string,
    status: ScheduledSuppressionEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.ceiling = ceiling;
    this.channel = channel;
    this.quantity = quantity;
    this.externalRef = externalRef;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledSuppressionEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledSuppressionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled suppression estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled suppression estimate"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.quantity - this.ceiling) * 100) / 100;
  }

  copy(): ScheduledSuppressionEstimate {
    return new ScheduledSuppressionEstimate(
      this.code,
      this.name,
      this.pinned,
      this.ceiling,
      this.channel,
      this.quantity,
      this.externalRef,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled suppression estimate in status requested. */
export function newScheduledSuppressionEstimate(code: string, name: string): ScheduledSuppressionEstimate {
  return new ScheduledSuppressionEstimate(code, name, false, 0, "", 0, "", "", "requested");
}
