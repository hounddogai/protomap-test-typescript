import * as text from "../../../../kit/text.js";

/** Where a model tier is in its life cycle. */
export type ModelTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A model tier as the model team keeps it. */
export class ModelTier {
  code: string;
  name: string;
  phone: string;
  unit: string;
  score: number;
  discount: number;
  updatedAt: number;
  openRate: number;
  threshold: number;
  retries: number;
  status: ModelTierStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    unit: string,
    score: number,
    discount: number,
    updatedAt: number,
    openRate: number,
    threshold: number,
    retries: number,
    status: ModelTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.unit = unit;
    this.score = score;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.threshold = threshold;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelTierStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ModelTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"model tier"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.updatedAt * this.retries * 100) / 100;
  }

  copy(): ModelTier {
    return new ModelTier(
      this.code,
      this.name,
      this.phone,
      this.unit,
      this.score,
      this.discount,
      this.updatedAt,
      this.openRate,
      this.threshold,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a model tier in status draft. */
export function newModelTier(code: string, name: string): ModelTier {
  return new ModelTier(code, name, "", "", 0, 0, 0, 0, 0, 0, "draft");
}
