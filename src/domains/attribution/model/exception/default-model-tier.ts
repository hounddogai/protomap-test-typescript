import * as text from "../../../../kit/text.js";

/** Where a default model tier is in its life cycle. */
export type DefaultModelTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default model tier. Its code is unique within a tenant. */
export class DefaultModelTier {
  code: string;
  label: string;
  priority: number;
  ceiling: number;
  attributes: Map<string, string>;
  active: boolean;
  frequencyCap: number;
  createdAt: number;
  currency: string;
  endsAt: number;
  minimum: number;
  status: DefaultModelTierStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    ceiling: number,
    attributes: Map<string, string>,
    active: boolean,
    frequencyCap: number,
    createdAt: number,
    currency: string,
    endsAt: number,
    minimum: number,
    status: DefaultModelTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.ceiling = ceiling;
    this.attributes = attributes;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.currency = currency;
    this.endsAt = endsAt;
    this.minimum = minimum;
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

  canMoveTo(next: DefaultModelTierStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultModelTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default model tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default model tier"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round(this.frequencyCap * this.priority * 100) / 100;
  }

  copy(): DefaultModelTier {
    return new DefaultModelTier(
      this.code,
      this.label,
      this.priority,
      this.ceiling,
      this.attributes,
      this.active,
      this.frequencyCap,
      this.createdAt,
      this.currency,
      this.endsAt,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default model tier in status planned. */
export function newDefaultModelTier(code: string, label: string): DefaultModelTier {
  return new DefaultModelTier(code, label, 0, 0, new Map<string, string>(), false, 0, 0, "", 0, 0, "planned");
}
