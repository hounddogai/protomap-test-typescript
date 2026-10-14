import * as text from "../../../../kit/text.js";

/** Where a tiered placement threshold is in its life cycle. */
export type TieredPlacementThresholdStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered placement threshold and its current status. */
export class TieredPlacementThreshold {
  code: string;
  name: string;
  amount: number;
  utmSource: string;
  description: string;
  active: boolean;
  title: string;
  timezone: string;
  status: TieredPlacementThresholdStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    utmSource: string,
    description: string,
    active: boolean,
    title: string,
    timezone: string,
    status: TieredPlacementThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.utmSource = utmSource;
    this.description = description;
    this.active = active;
    this.title = title;
    this.timezone = timezone;
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

  canMoveTo(next: TieredPlacementThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
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

  moveTo(next: TieredPlacementThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered placement threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): TieredPlacementThreshold {
    return new TieredPlacementThreshold(
      this.code,
      this.name,
      this.amount,
      this.utmSource,
      this.description,
      this.active,
      this.title,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered placement threshold in status created. */
export function newTieredPlacementThreshold(code: string, name: string): TieredPlacementThreshold {
  return new TieredPlacementThreshold(code, name, 0, "", "", false, "", "", "created");
}
