import * as text from "../../../../kit/text.js";

/** Where a tiered double opt in plan is in its life cycle. */
export type TieredDoubleOptInPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered double opt in plan. Its code is unique within a tenant. */
export class TieredDoubleOptInPlan {
  code: string;
  label: string;
  bid: number;
  category: string;
  sendAt: number;
  version: number;
  checksum: string;
  expiresAt: number;
  ratio: number;
  createdAt: number;
  status: TieredDoubleOptInPlanStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    category: string,
    sendAt: number,
    version: number,
    checksum: string,
    expiresAt: number,
    ratio: number,
    createdAt: number,
    status: TieredDoubleOptInPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.category = category;
    this.sendAt = sendAt;
    this.version = version;
    this.checksum = checksum;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.createdAt = createdAt;
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

  canMoveTo(next: TieredDoubleOptInPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
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

  moveTo(next: TieredDoubleOptInPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered double opt in plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.expiresAt + this.ratio) * 100) / 100;
  }

  copy(): TieredDoubleOptInPlan {
    return new TieredDoubleOptInPlan(
      this.code,
      this.label,
      this.bid,
      this.category,
      this.sendAt,
      this.version,
      this.checksum,
      this.expiresAt,
      this.ratio,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered double opt in plan in status requested. */
export function newTieredDoubleOptInPlan(code: string, label: string): TieredDoubleOptInPlan {
  return new TieredDoubleOptInPlan(code, label, 0, "", 0, 0, "", 0, 0, 0, "requested");
}
