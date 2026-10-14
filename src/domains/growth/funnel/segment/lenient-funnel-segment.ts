/**
 * The lenient funnel segment records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient funnel segment is in its life cycle. */
export type LenientFunnelSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One lenient funnel segment, with what the planners need to act on it. */
export class LenientFunnelSegment {
  code: string;
  name: string;
  attributes: Map<string, string>;
  updatedAt: number;
  currency: string;
  variant: string;
  batchSize: number;
  description: string;
  segment: string;
  unit: string;
  status: LenientFunnelSegmentStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    updatedAt: number,
    currency: string,
    variant: string,
    batchSize: number,
    description: string,
    segment: string,
    unit: string,
    status: LenientFunnelSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.updatedAt = updatedAt;
    this.currency = currency;
    this.variant = variant;
    this.batchSize = batchSize;
    this.description = description;
    this.segment = segment;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientFunnelSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientFunnelSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient funnel segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round(this.updatedAt * this.batchSize * 100) / 100;
  }

  copy(): LenientFunnelSegment {
    return new LenientFunnelSegment(
      this.code,
      this.name,
      this.attributes,
      this.updatedAt,
      this.currency,
      this.variant,
      this.batchSize,
      this.description,
      this.segment,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient funnel segment in status requested. */
export function newLenientFunnelSegment(code: string, name: string): LenientFunnelSegment {
  return new LenientFunnelSegment(code, name, new Map<string, string>(), 0, "", "", 0, "", "", "", "requested");
}
