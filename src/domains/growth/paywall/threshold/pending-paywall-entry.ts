import * as text from "../../../../kit/text.js";

/** Where a pending paywall entry is in its life cycle. */
export type PendingPaywallEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pending paywall entry, with what the planners need to act on it. */
export class PendingPaywallEntry {
  code: string;
  name: string;
  variant: string;
  segment: string;
  minimum: number;
  expiresAt: number;
  attempts: number;
  cost: number;
  externalRef: string;
  locale: string;
  attributes: Map<string, string>;
  status: PendingPaywallEntryStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    segment: string,
    minimum: number,
    expiresAt: number,
    attempts: number,
    cost: number,
    externalRef: string,
    locale: string,
    attributes: Map<string, string>,
    status: PendingPaywallEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.segment = segment;
    this.minimum = minimum;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.cost = cost;
    this.externalRef = externalRef;
    this.locale = locale;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingPaywallEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingPaywallEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending paywall entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
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

  weightedLoad(): number {
    return Math.round((this.cost + this.attempts) * 100) / 100;
  }

  copy(): PendingPaywallEntry {
    return new PendingPaywallEntry(
      this.code,
      this.name,
      this.variant,
      this.segment,
      this.minimum,
      this.expiresAt,
      this.attempts,
      this.cost,
      this.externalRef,
      this.locale,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending paywall entry in status proposed. */
export function newPendingPaywallEntry(code: string, name: string): PendingPaywallEntry {
  return new PendingPaywallEntry(code, name, "", "", 0, 0, 0, 0, "", "", new Map<string, string>(), "proposed");
}
