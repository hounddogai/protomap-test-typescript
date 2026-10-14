import * as text from "../../../../kit/text.js";

/** Where a bounce mapping is in its life cycle. */
export type BounceMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a bounce mapping and its current status. */
export class BounceMapping {
  code: string;
  name: string;
  graceDays: number;
  phone: string;
  ratio: number;
  budget: number;
  margin: number;
  conversionRate: number;
  status: BounceMappingStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    phone: string,
    ratio: number,
    budget: number,
    margin: number,
    conversionRate: number,
    status: BounceMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.phone = phone;
    this.ratio = ratio;
    this.budget = budget;
    this.margin = margin;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: BounceMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BounceMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"bounce mapping"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.graceDays - this.ratio) * 100) / 100;
  }

  copy(): BounceMapping {
    return new BounceMapping(
      this.code,
      this.name,
      this.graceDays,
      this.phone,
      this.ratio,
      this.budget,
      this.margin,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bounce mapping in status planned. */
export function newBounceMapping(code: string, name: string): BounceMapping {
  return new BounceMapping(code, name, 0, "", 0, 0, 0, 0, "planned");
}
