import * as text from "../../../../kit/text.js";

/** Where a fallback deflection digest is in its life cycle. */
export type FallbackDeflectionDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fallback deflection digest and its current status. */
export class FallbackDeflectionDigest {
  code: string;
  name: string;
  attributes: Map<string, string>;
  impressions: number;
  locale: string;
  frequencyCap: number;
  phone: string;
  retries: number;
  approved: boolean;
  status: FallbackDeflectionDigestStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    impressions: number,
    locale: string,
    frequencyCap: number,
    phone: string,
    retries: number,
    approved: boolean,
    status: FallbackDeflectionDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.impressions = impressions;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.retries = retries;
    this.approved = approved;
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

  canMoveTo(next: FallbackDeflectionDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackDeflectionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback deflection digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  adjustedValue(): number {
    return Math.round((this.retries + this.impressions) * 100) / 100;
  }

  copy(): FallbackDeflectionDigest {
    return new FallbackDeflectionDigest(
      this.code,
      this.name,
      this.attributes,
      this.impressions,
      this.locale,
      this.frequencyCap,
      this.phone,
      this.retries,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback deflection digest in status open. */
export function newFallbackDeflectionDigest(code: string, name: string): FallbackDeflectionDigest {
  return new FallbackDeflectionDigest(code, name, new Map<string, string>(), 0, "", 0, "", 0, false, "open");
}
