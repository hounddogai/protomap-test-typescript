import * as text from "../../../../kit/text.js";

/** Where a fallback payout quota is in its life cycle. */
export type FallbackPayoutQuotaStatus = "created" | "validated" | "published" | "retired";

/** A fallback payout quota. Its code is unique within a tenant. */
export class FallbackPayoutQuota {
  code: string;
  name: string;
  maximum: number;
  sendAt: number;
  updatedAt: number;
  rate: number;
  visible: boolean;
  status: FallbackPayoutQuotaStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    sendAt: number,
    updatedAt: number,
    rate: number,
    visible: boolean,
    status: FallbackPayoutQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.sendAt = sendAt;
    this.updatedAt = updatedAt;
    this.rate = rate;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackPayoutQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackPayoutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback payout quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.maximum * this.rate * 100) / 100;
  }

  copy(): FallbackPayoutQuota {
    return new FallbackPayoutQuota(
      this.code,
      this.name,
      this.maximum,
      this.sendAt,
      this.updatedAt,
      this.rate,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback payout quota in status created. */
export function newFallbackPayoutQuota(code: string, name: string): FallbackPayoutQuota {
  return new FallbackPayoutQuota(code, name, 0, 0, 0, 0, false, "created");
}
