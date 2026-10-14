import * as text from "../../../../kit/text.js";

/** Where a primary touchpoint target is in its life cycle. */
export type PrimaryTouchpointTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary touchpoint target. Its code is unique within a tenant. */
export class PrimaryTouchpointTarget {
  code: string;
  name: string;
  amount: number;
  version: number;
  variant: string;
  status: PrimaryTouchpointTargetStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    version: number,
    variant: string,
    status: PrimaryTouchpointTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.version = version;
    this.variant = variant;
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

  canMoveTo(next: PrimaryTouchpointTargetStatus): boolean {
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

  moveTo(next: PrimaryTouchpointTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary touchpoint target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round((this.amount + this.version) * 100) / 100;
  }

  copy(): PrimaryTouchpointTarget {
    return new PrimaryTouchpointTarget(this.code, this.name, this.amount, this.version, this.variant, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary touchpoint target in status requested. */
export function newPrimaryTouchpointTarget(code: string, name: string): PrimaryTouchpointTarget {
  return new PrimaryTouchpointTarget(code, name, 0, 0, "", "requested");
}
