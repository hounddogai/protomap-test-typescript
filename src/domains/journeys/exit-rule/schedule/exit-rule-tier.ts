import * as text from "../../../../kit/text.js";

/** Where a exit rule tier is in its life cycle. */
export type ExitRuleTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A exit rule tier. Its code is unique within a tenant. */
export class ExitRuleTier {
  code: string;
  label: string;
  limit: number;
  attributes: Map<string, string>;
  impressions: number;
  phone: string;
  threshold: number;
  locale: string;
  status: ExitRuleTierStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    attributes: Map<string, string>,
    impressions: number,
    phone: string,
    threshold: number,
    locale: string,
    status: ExitRuleTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.attributes = attributes;
    this.impressions = impressions;
    this.phone = phone;
    this.threshold = threshold;
    this.locale = locale;
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

  canMoveTo(next: ExitRuleTierStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ExitRuleTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule tier ${this.code} cannot move from ${this.status} to ${next}`);
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

  netExposure(): number {
    return Math.round((this.threshold + this.impressions) * 100) / 100;
  }

  copy(): ExitRuleTier {
    return new ExitRuleTier(
      this.code,
      this.label,
      this.limit,
      this.attributes,
      this.impressions,
      this.phone,
      this.threshold,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a exit rule tier in status draft. */
export function newExitRuleTier(code: string, label: string): ExitRuleTier {
  return new ExitRuleTier(code, label, 0, new Map<string, string>(), 0, "", 0, "", "draft");
}
