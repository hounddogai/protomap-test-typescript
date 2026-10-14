import * as text from "../../../../kit/text.js";

/** Where a tiered model variance is in its life cycle. */
export type TieredModelVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered model variance as the model team keeps it. */
export class TieredModelVariance {
  code: string;
  title: string;
  rate: number;
  ceiling: number;
  attempts: number;
  status: TieredModelVarianceStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    ceiling: number,
    attempts: number,
    status: TieredModelVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.ceiling = ceiling;
    this.attempts = attempts;
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

  canMoveTo(next: TieredModelVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredModelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered model variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.attempts - this.rate) * 100) / 100;
  }

  copy(): TieredModelVariance {
    return new TieredModelVariance(this.code, this.title, this.rate, this.ceiling, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered model variance in status requested. */
export function newTieredModelVariance(code: string, title: string): TieredModelVariance {
  return new TieredModelVariance(code, title, 0, 0, 0, "requested");
}
