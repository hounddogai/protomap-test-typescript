import * as text from "../../../../kit/text.js";

/** Where a fraud check slot is in its life cycle. */
export type FraudCheckSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a fraud check slot and its current status. */
export class FraudCheckSlot {
  code: string;
  label: string;
  durationMinutes: number;
  segment: string;
  attributes: Map<string, string>;
  channel: string;
  variant: string;
  cost: number;
  status: FraudCheckSlotStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    segment: string,
    attributes: Map<string, string>,
    channel: string,
    variant: string,
    cost: number,
    status: FraudCheckSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.segment = segment;
    this.attributes = attributes;
    this.channel = channel;
    this.variant = variant;
    this.cost = cost;
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

  canMoveTo(next: FraudCheckSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
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

  moveTo(next: FraudCheckSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round((this.cost + this.durationMinutes) * 100) / 100;
  }

  copy(): FraudCheckSlot {
    return new FraudCheckSlot(
      this.code,
      this.label,
      this.durationMinutes,
      this.segment,
      this.attributes,
      this.channel,
      this.variant,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fraud check slot in status draft. */
export function newFraudCheckSlot(code: string, label: string): FraudCheckSlot {
  return new FraudCheckSlot(code, label, 0, "", new Map<string, string>(), "", "", 0, "draft");
}
