import * as text from "../../../../kit/text.js";

/** Where a capped domain threshold is in its life cycle. */
export type CappedDomainThresholdStatus = "created" | "validated" | "published" | "retired";

/** A capped domain threshold. Its code is unique within a tenant. */
export class CappedDomainThreshold {
  code: string;
  label: string;
  category: string;
  currency: string;
  revision: number;
  clicks: number;
  attributes: Map<string, string>;
  durationMinutes: number;
  status: CappedDomainThresholdStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    currency: string,
    revision: number,
    clicks: number,
    attributes: Map<string, string>,
    durationMinutes: number,
    status: CappedDomainThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.currency = currency;
    this.revision = revision;
    this.clicks = clicks;
    this.attributes = attributes;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: CappedDomainThresholdStatus): boolean {
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

  moveTo(next: CappedDomainThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped domain threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round(this.clicks * this.revision * 100) / 100;
  }

  copy(): CappedDomainThreshold {
    return new CappedDomainThreshold(
      this.code,
      this.label,
      this.category,
      this.currency,
      this.revision,
      this.clicks,
      this.attributes,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped domain threshold in status created. */
export function newCappedDomainThreshold(code: string, label: string): CappedDomainThreshold {
  return new CappedDomainThreshold(code, label, "", "", 0, 0, new Map<string, string>(), 0, "created");
}
