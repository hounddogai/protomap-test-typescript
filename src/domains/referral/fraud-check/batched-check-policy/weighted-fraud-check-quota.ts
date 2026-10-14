import * as text from "../../../../kit/text.js";

/** Where a weighted fraud check quota is in its life cycle. */
export type WeightedFraudCheckQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted fraud check quota as the fraud check team keeps it. */
export class WeightedFraudCheckQuota {
  code: string;
  label: string;
  budget: number;
  conversionRate: number;
  minimum: number;
  title: string;
  weight: number;
  sendAt: number;
  status: WeightedFraudCheckQuotaStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    conversionRate: number,
    minimum: number,
    title: string,
    weight: number,
    sendAt: number,
    status: WeightedFraudCheckQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.minimum = minimum;
    this.title = title;
    this.weight = weight;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedFraudCheckQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedFraudCheckQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted fraud check quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round((this.minimum + this.sendAt) * 100) / 100;
  }

  copy(): WeightedFraudCheckQuota {
    return new WeightedFraudCheckQuota(
      this.code,
      this.label,
      this.budget,
      this.conversionRate,
      this.minimum,
      this.title,
      this.weight,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted fraud check quota in status planned. */
export function newWeightedFraudCheckQuota(code: string, label: string): WeightedFraudCheckQuota {
  return new WeightedFraudCheckQuota(code, label, 0, 0, 0, "", 0, 0, "planned");
}
