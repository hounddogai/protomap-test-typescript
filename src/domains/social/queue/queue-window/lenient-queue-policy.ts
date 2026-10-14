import * as text from "../../../../kit/text.js";

/** Where a lenient queue policy is in its life cycle. */
export type LenientQueuePolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient queue policy. Its code is unique within a tenant. */
export class LenientQueuePolicy {
  code: string;
  name: string;
  endsAt: number;
  priority: number;
  cost: number;
  sendAt: number;
  windowDays: number;
  conversionRate: number;
  margin: number;
  status: LenientQueuePolicyStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    priority: number,
    cost: number,
    sendAt: number,
    windowDays: number,
    conversionRate: number,
    margin: number,
    status: LenientQueuePolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.priority = priority;
    this.cost = cost;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.conversionRate = conversionRate;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientQueuePolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientQueuePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient queue policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedValue(): number {
    return Math.round((this.endsAt + this.sendAt) * 100) / 100;
  }

  copy(): LenientQueuePolicy {
    return new LenientQueuePolicy(
      this.code,
      this.name,
      this.endsAt,
      this.priority,
      this.cost,
      this.sendAt,
      this.windowDays,
      this.conversionRate,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient queue policy in status proposed. */
export function newLenientQueuePolicy(code: string, name: string): LenientQueuePolicy {
  return new LenientQueuePolicy(code, name, 0, 0, 0, 0, 0, 0, 0, "proposed");
}
