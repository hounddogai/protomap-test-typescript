import * as text from "../../../../kit/text.js";

/** Where a rolling conversion bundle is in its life cycle. */
export type RollingConversionBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling conversion bundle. Its code is unique within a tenant. */
export class RollingConversionBundle {
  code: string;
  name: string;
  visible: boolean;
  active: boolean;
  country: string;
  amount: number;
  status: RollingConversionBundleStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    active: boolean,
    country: string,
    amount: number,
    status: RollingConversionBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.active = active;
    this.country = country;
    this.amount = amount;
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

  canMoveTo(next: RollingConversionBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingConversionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling conversion bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): RollingConversionBundle {
    return new RollingConversionBundle(
      this.code,
      this.name,
      this.visible,
      this.active,
      this.country,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a rolling conversion bundle in status proposed. */
export function newRollingConversionBundle(code: string, name: string): RollingConversionBundle {
  return new RollingConversionBundle(code, name, false, false, "", 0, "proposed");
}
