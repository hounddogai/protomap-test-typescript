import * as text from "../../../../kit/text.js";

/** Where a tier rollup is in its life cycle. */
export type TierRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** A tier rollup as the tier team keeps it. */
export class TierRollup {
  code: string;
  label: string;
  name: string;
  quantity: number;
  expiresAt: number;
  openRate: number;
  locale: string;
  weight: number;
  status: TierRollupStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    quantity: number,
    expiresAt: number,
    openRate: number,
    locale: string,
    weight: number,
    status: TierRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.quantity = quantity;
    this.expiresAt = expiresAt;
    this.openRate = openRate;
    this.locale = locale;
    this.weight = weight;
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

  canMoveTo(next: TierRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
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

  moveTo(next: TierRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedExposure(): number {
    return Math.round((this.weight - this.quantity) * 100) / 100;
  }

  copy(): TierRollup {
    return new TierRollup(
      this.code,
      this.label,
      this.name,
      this.quantity,
      this.expiresAt,
      this.openRate,
      this.locale,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tier rollup in status requested. */
export function newTierRollup(code: string, label: string): TierRollup {
  return new TierRollup(code, label, "", 0, 0, 0, "", 0, "requested");
}
