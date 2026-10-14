import * as text from "../../../../kit/text.js";

/** Where a default fraud check bundle is in its life cycle. */
export type DefaultFraudCheckBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** A default fraud check bundle. Its code is unique within a tenant. */
export class DefaultFraudCheckBundle {
  code: string;
  name: string;
  variant: string;
  bid: number;
  externalRef: string;
  status: DefaultFraudCheckBundleStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    bid: number,
    externalRef: string,
    status: DefaultFraudCheckBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.bid = bid;
    this.externalRef = externalRef;
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

  canMoveTo(next: DefaultFraudCheckBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultFraudCheckBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default fraud check bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default fraud check bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): DefaultFraudCheckBundle {
    return new DefaultFraudCheckBundle(this.code, this.name, this.variant, this.bid, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default fraud check bundle in status requested. */
export function newDefaultFraudCheckBundle(code: string, name: string): DefaultFraudCheckBundle {
  return new DefaultFraudCheckBundle(code, name, "", 0, "", "requested");
}
