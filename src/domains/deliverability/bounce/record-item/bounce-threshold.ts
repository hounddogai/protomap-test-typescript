import * as text from "../../../../kit/text.js";

/** Where a bounce threshold is in its life cycle. */
export type BounceThresholdStatus = "created" | "validated" | "published" | "retired";

/** One bounce threshold, with what the planners need to act on it. */
export class BounceThreshold {
  code: string;
  name: string;
  category: string;
  startsAt: number;
  attributes: Map<string, string>;
  cost: number;
  ceiling: number;
  channel: string;
  createdAt: number;
  status: BounceThresholdStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    startsAt: number,
    attributes: Map<string, string>,
    cost: number,
    ceiling: number,
    channel: string,
    createdAt: number,
    status: BounceThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.startsAt = startsAt;
    this.attributes = attributes;
    this.cost = cost;
    this.ceiling = ceiling;
    this.channel = channel;
    this.createdAt = createdAt;
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

  canMoveTo(next: BounceThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BounceThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round((this.cost + this.startsAt) * 100) / 100;
  }

  copy(): BounceThreshold {
    return new BounceThreshold(
      this.code,
      this.name,
      this.category,
      this.startsAt,
      this.attributes,
      this.cost,
      this.ceiling,
      this.channel,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a bounce threshold in status created. */
export function newBounceThreshold(code: string, name: string): BounceThreshold {
  return new BounceThreshold(code, name, "", 0, new Map<string, string>(), 0, 0, "", 0, "created");
}
