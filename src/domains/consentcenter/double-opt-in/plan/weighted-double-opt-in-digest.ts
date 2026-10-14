import * as text from "../../../../kit/text.js";

/** Where a weighted double opt in digest is in its life cycle. */
export type WeightedDoubleOptInDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted double opt in digest. Its code is unique within a tenant. */
export class WeightedDoubleOptInDigest {
  code: string;
  name: string;
  pinned: boolean;
  endsAt: number;
  unit: string;
  startsAt: number;
  budget: number;
  status: WeightedDoubleOptInDigestStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    endsAt: number,
    unit: string,
    startsAt: number,
    budget: number,
    status: WeightedDoubleOptInDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.unit = unit;
    this.startsAt = startsAt;
    this.budget = budget;
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

  canMoveTo(next: WeightedDoubleOptInDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedDoubleOptInDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted double opt in digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.endsAt * this.startsAt * 100) / 100;
  }

  copy(): WeightedDoubleOptInDigest {
    return new WeightedDoubleOptInDigest(
      this.code,
      this.name,
      this.pinned,
      this.endsAt,
      this.unit,
      this.startsAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted double opt in digest in status planned. */
export function newWeightedDoubleOptInDigest(code: string, name: string): WeightedDoubleOptInDigest {
  return new WeightedDoubleOptInDigest(code, name, false, 0, "", 0, 0, "planned");
}
