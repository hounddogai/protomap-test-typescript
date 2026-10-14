import * as text from "../../../../kit/text.js";

/** Where a rolling complaint policy is in its life cycle. */
export type RollingComplaintPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling complaint policy as the complaint team keeps it. */
export class RollingComplaintPolicy {
  code: string;
  label: string;
  capacity: number;
  variant: string;
  sequence: number;
  cost: number;
  status: RollingComplaintPolicyStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    variant: string,
    sequence: number,
    cost: number,
    status: RollingComplaintPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.variant = variant;
    this.sequence = sequence;
    this.cost = cost;
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

  canMoveTo(next: RollingComplaintPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingComplaintPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling complaint policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round(this.sequence * this.cost * 100) / 100;
  }

  copy(): RollingComplaintPolicy {
    return new RollingComplaintPolicy(
      this.code,
      this.label,
      this.capacity,
      this.variant,
      this.sequence,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling complaint policy in status requested. */
export function newRollingComplaintPolicy(code: string, label: string): RollingComplaintPolicy {
  return new RollingComplaintPolicy(code, label, 0, "", 0, 0, "requested");
}
