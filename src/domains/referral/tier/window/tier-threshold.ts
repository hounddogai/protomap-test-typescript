import * as text from "../../../../kit/text.js";

/** Where a tier threshold is in its life cycle. */
export type TierThresholdStatus = "created" | "validated" | "published" | "retired";

/** A tier threshold as the tier team keeps it. */
export class TierThreshold {
  code: string;
  label: string;
  category: string;
  score: number;
  attributes: Map<string, string>;
  channel: string;
  description: string;
  checksum: string;
  unit: string;
  status: TierThresholdStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    score: number,
    attributes: Map<string, string>,
    channel: string,
    description: string,
    checksum: string,
    unit: string,
    status: TierThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.score = score;
    this.attributes = attributes;
    this.channel = channel;
    this.description = description;
    this.checksum = checksum;
    this.unit = unit;
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

  canMoveTo(next: TierThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
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

  moveTo(next: TierThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): TierThreshold {
    return new TierThreshold(
      this.code,
      this.label,
      this.category,
      this.score,
      this.attributes,
      this.channel,
      this.description,
      this.checksum,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tier threshold in status created. */
export function newTierThreshold(code: string, label: string): TierThreshold {
  return new TierThreshold(code, label, "", 0, new Map<string, string>(), "", "", "", "", "created");
}
