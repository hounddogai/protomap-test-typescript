import * as text from "../../../../kit/text.js";

/** Where a frequency tier is in its life cycle. */
export type FrequencyTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a frequency tier and its current status. */
export class FrequencyTier {
  code: string;
  label: string;
  approved: boolean;
  tags: string[];
  description: string;
  region: string;
  attributes: Map<string, string>;
  utmSource: string;
  amount: number;
  source: string;
  weight: number;
  status: FrequencyTierStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    tags: string[],
    description: string,
    region: string,
    attributes: Map<string, string>,
    utmSource: string,
    amount: number,
    source: string,
    weight: number,
    status: FrequencyTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.tags = tags;
    this.description = description;
    this.region = region;
    this.attributes = attributes;
    this.utmSource = utmSource;
    this.amount = amount;
    this.source = source;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FrequencyTierStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FrequencyTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round((this.amount - this.weight) * 100) / 100;
  }

  copy(): FrequencyTier {
    return new FrequencyTier(
      this.code,
      this.label,
      this.approved,
      this.tags,
      this.description,
      this.region,
      this.attributes,
      this.utmSource,
      this.amount,
      this.source,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a frequency tier in status open. */
export function newFrequencyTier(code: string, label: string): FrequencyTier {
  return new FrequencyTier(code, label, false, [], "", "", new Map<string, string>(), "", 0, "", 0, "open");
}
