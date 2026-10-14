import * as text from "../../../../kit/text.js";

/** Where a warmup reservation is in its life cycle. */
export type WarmupReservationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One warmup reservation, with what the planners need to act on it. */
export class WarmupReservation {
  code: string;
  name: string;
  description: string;
  ceiling: number;
  attributes: Map<string, string>;
  unit: string;
  category: string;
  weight: number;
  phone: string;
  status: WarmupReservationStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    ceiling: number,
    attributes: Map<string, string>,
    unit: string,
    category: string,
    weight: number,
    phone: string,
    status: WarmupReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.ceiling = ceiling;
    this.attributes = attributes;
    this.unit = unit;
    this.category = category;
    this.weight = weight;
    this.phone = phone;
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

  canMoveTo(next: WarmupReservationStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WarmupReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.ceiling + this.weight) * 100) / 100;
  }

  copy(): WarmupReservation {
    return new WarmupReservation(
      this.code,
      this.name,
      this.description,
      this.ceiling,
      this.attributes,
      this.unit,
      this.category,
      this.weight,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a warmup reservation in status draft. */
export function newWarmupReservation(code: string, name: string): WarmupReservation {
  return new WarmupReservation(code, name, "", 0, new Map<string, string>(), "", "", 0, "", "draft");
}
