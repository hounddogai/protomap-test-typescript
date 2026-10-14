import * as text from "../../../../kit/text.js";

/** Where a default redemption variance is in its life cycle. */
export type DefaultRedemptionVarianceStatus = "created" | "validated" | "published" | "retired";

/** A default redemption variance. Its code is unique within a tenant. */
export class DefaultRedemptionVariance {
  code: string;
  label: string;
  startsAt: number;
  locale: string;
  source: string;
  limit: number;
  checksum: string;
  attributes: Map<string, string>;
  rate: number;
  status: DefaultRedemptionVarianceStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    locale: string,
    source: string,
    limit: number,
    checksum: string,
    attributes: Map<string, string>,
    rate: number,
    status: DefaultRedemptionVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.locale = locale;
    this.source = source;
    this.limit = limit;
    this.checksum = checksum;
    this.attributes = attributes;
    this.rate = rate;
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

  canMoveTo(next: DefaultRedemptionVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultRedemptionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default redemption variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round((this.limit + this.rate) * 100) / 100;
  }

  copy(): DefaultRedemptionVariance {
    return new DefaultRedemptionVariance(
      this.code,
      this.label,
      this.startsAt,
      this.locale,
      this.source,
      this.limit,
      this.checksum,
      this.attributes,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default redemption variance in status created. */
export function newDefaultRedemptionVariance(code: string, label: string): DefaultRedemptionVariance {
  return new DefaultRedemptionVariance(code, label, 0, "", "", 0, "", new Map<string, string>(), 0, "created");
}
