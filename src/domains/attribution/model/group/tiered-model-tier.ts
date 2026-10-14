import * as text from "../../../../kit/text.js";

/** Where a tiered model tier is in its life cycle. */
export type TieredModelTierStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered model tier and its current status. */
export class TieredModelTier {
  code: string;
  name: string;
  category: string;
  priority: number;
  notes: string;
  country: string;
  graceDays: number;
  expiresAt: number;
  status: TieredModelTierStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    priority: number,
    notes: string,
    country: string,
    graceDays: number,
    expiresAt: number,
    status: TieredModelTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.priority = priority;
    this.notes = notes;
    this.country = country;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: TieredModelTierStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredModelTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered model tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.priority + this.graceDays) * 100) / 100;
  }

  copy(): TieredModelTier {
    return new TieredModelTier(
      this.code,
      this.name,
      this.category,
      this.priority,
      this.notes,
      this.country,
      this.graceDays,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered model tier in status created. */
export function newTieredModelTier(code: string, name: string): TieredModelTier {
  return new TieredModelTier(code, name, "", 0, "", "", 0, 0, "created");
}
