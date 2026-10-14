import * as text from "../../../../kit/text.js";

/** Where a legacy fraud check digest is in its life cycle. */
export type LegacyFraudCheckDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A legacy fraud check digest as the fraud check team keeps it. */
export class LegacyFraudCheckDigest {
  code: string;
  name: string;
  tags: string[];
  frequencyCap: number;
  ownerId: string;
  capacity: number;
  threshold: number;
  budget: number;
  active: boolean;
  status: LegacyFraudCheckDigestStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    frequencyCap: number,
    ownerId: string,
    capacity: number,
    threshold: number,
    budget: number,
    active: boolean,
    status: LegacyFraudCheckDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.frequencyCap = frequencyCap;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.threshold = threshold;
    this.budget = budget;
    this.active = active;
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

  canMoveTo(next: LegacyFraudCheckDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LegacyFraudCheckDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy fraud check digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round((this.threshold + this.capacity) * 100) / 100;
  }

  copy(): LegacyFraudCheckDigest {
    return new LegacyFraudCheckDigest(
      this.code,
      this.name,
      this.tags,
      this.frequencyCap,
      this.ownerId,
      this.capacity,
      this.threshold,
      this.budget,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy fraud check digest in status planned. */
export function newLegacyFraudCheckDigest(code: string, name: string): LegacyFraudCheckDigest {
  return new LegacyFraudCheckDigest(code, name, [], 0, "", 0, 0, 0, false, "planned");
}
