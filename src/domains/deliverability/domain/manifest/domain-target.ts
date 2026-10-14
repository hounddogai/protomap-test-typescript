import * as text from "../../../../kit/text.js";

/** Where a domain target is in its life cycle. */
export type DomainTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** A domain target as the domain team keeps it. */
export class DomainTarget {
  code: string;
  label: string;
  quantity: number;
  channel: string;
  cost: number;
  budget: number;
  amount: number;
  minimum: number;
  status: DomainTargetStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    channel: string,
    cost: number,
    budget: number,
    amount: number,
    minimum: number,
    status: DomainTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.channel = channel;
    this.cost = cost;
    this.budget = budget;
    this.amount = amount;
    this.minimum = minimum;
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

  canMoveTo(next: DomainTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"domain target"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.amount + this.budget) * 100) / 100;
  }

  copy(): DomainTarget {
    return new DomainTarget(
      this.code,
      this.label,
      this.quantity,
      this.channel,
      this.cost,
      this.budget,
      this.amount,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a domain target in status requested. */
export function newDomainTarget(code: string, label: string): DomainTarget {
  return new DomainTarget(code, label, 0, "", 0, 0, 0, 0, "requested");
}
