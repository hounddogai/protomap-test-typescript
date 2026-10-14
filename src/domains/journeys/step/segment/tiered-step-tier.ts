import * as text from "../../../../kit/text.js";

/** Where a tiered step tier is in its life cycle. */
export type TieredStepTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered step tier as the step team keeps it. */
export class TieredStepTier {
  code: string;
  name: string;
  revision: number;
  reviewer: string;
  createdAt: number;
  visible: boolean;
  currency: string;
  ceiling: number;
  status: TieredStepTierStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    reviewer: string,
    createdAt: number,
    visible: boolean,
    currency: string,
    ceiling: number,
    status: TieredStepTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
    this.visible = visible;
    this.currency = currency;
    this.ceiling = ceiling;
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

  canMoveTo(next: TieredStepTierStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredStepTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered step tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.createdAt * this.revision * 100) / 100;
  }

  copy(): TieredStepTier {
    return new TieredStepTier(
      this.code,
      this.name,
      this.revision,
      this.reviewer,
      this.createdAt,
      this.visible,
      this.currency,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered step tier in status draft. */
export function newTieredStepTier(code: string, name: string): TieredStepTier {
  return new TieredStepTier(code, name, 0, "", 0, false, "", 0, "draft");
}
