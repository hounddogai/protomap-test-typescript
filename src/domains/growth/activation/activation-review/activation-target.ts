import * as text from "../../../../kit/text.js";

/** Where a activation target is in its life cycle. */
export type ActivationTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** One activation target, with what the planners need to act on it. */
export class ActivationTarget {
  code: string;
  name: string;
  capacity: number;
  active: boolean;
  openRate: number;
  quantity: number;
  status: ActivationTargetStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    active: boolean,
    openRate: number,
    quantity: number,
    status: ActivationTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.active = active;
    this.openRate = openRate;
    this.quantity = quantity;
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

  canMoveTo(next: ActivationTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ActivationTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.capacity - this.openRate) * 100) / 100;
  }

  copy(): ActivationTarget {
    return new ActivationTarget(
      this.code,
      this.name,
      this.capacity,
      this.active,
      this.openRate,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a activation target in status requested. */
export function newActivationTarget(code: string, name: string): ActivationTarget {
  return new ActivationTarget(code, name, 0, false, 0, 0, "requested");
}
