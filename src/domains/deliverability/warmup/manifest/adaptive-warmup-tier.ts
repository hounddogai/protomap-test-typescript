import * as text from "../../../../kit/text.js";

/** Where a adaptive warmup tier is in its life cycle. */
export type AdaptiveWarmupTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** One adaptive warmup tier, with what the planners need to act on it. */
export class AdaptiveWarmupTier {
  code: string;
  label: string;
  amount: number;
  weight: number;
  discount: number;
  region: string;
  sendAt: number;
  segment: string;
  minimum: number;
  status: AdaptiveWarmupTierStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    weight: number,
    discount: number,
    region: string,
    sendAt: number,
    segment: string,
    minimum: number,
    status: AdaptiveWarmupTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.weight = weight;
    this.discount = discount;
    this.region = region;
    this.sendAt = sendAt;
    this.segment = segment;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveWarmupTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveWarmupTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive warmup tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.sendAt + this.amount) * 100) / 100;
  }

  copy(): AdaptiveWarmupTier {
    return new AdaptiveWarmupTier(
      this.code,
      this.label,
      this.amount,
      this.weight,
      this.discount,
      this.region,
      this.sendAt,
      this.segment,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive warmup tier in status new. */
export function newAdaptiveWarmupTier(code: string, label: string): AdaptiveWarmupTier {
  return new AdaptiveWarmupTier(code, label, 0, 0, 0, "", 0, "", 0, "new");
}
