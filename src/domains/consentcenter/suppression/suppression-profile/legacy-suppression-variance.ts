import * as text from "../../../../kit/text.js";

/** Where a legacy suppression variance is in its life cycle. */
export type LegacySuppressionVarianceStatus = "created" | "validated" | "published" | "retired";

/** A legacy suppression variance as the suppression team keeps it. */
export class LegacySuppressionVariance {
  code: string;
  title: string;
  notes: string;
  attributes: Map<string, string>;
  frequencyCap: number;
  segment: string;
  country: string;
  status: LegacySuppressionVarianceStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    attributes: Map<string, string>,
    frequencyCap: number,
    segment: string,
    country: string,
    status: LegacySuppressionVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.attributes = attributes;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.country = country;
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

  canMoveTo(next: LegacySuppressionVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacySuppressionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy suppression variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): LegacySuppressionVariance {
    return new LegacySuppressionVariance(
      this.code,
      this.title,
      this.notes,
      this.attributes,
      this.frequencyCap,
      this.segment,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy suppression variance in status created. */
export function newLegacySuppressionVariance(code: string, title: string): LegacySuppressionVariance {
  return new LegacySuppressionVariance(code, title, "", new Map<string, string>(), 0, "", "", "created");
}
