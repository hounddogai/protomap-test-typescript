import * as text from "../../../../kit/text.js";

/** Where a strict bid rule threshold is in its life cycle. */
export type StrictBidRuleThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict bid rule threshold. Its code is unique within a tenant. */
export class StrictBidRuleThreshold {
  code: string;
  name: string;
  margin: number;
  revision: number;
  createdAt: number;
  amount: number;
  graceDays: number;
  attributes: Map<string, string>;
  pinned: boolean;
  contactEmail: string;
  status: StrictBidRuleThresholdStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    revision: number,
    createdAt: number,
    amount: number,
    graceDays: number,
    attributes: Map<string, string>,
    pinned: boolean,
    contactEmail: string,
    status: StrictBidRuleThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.revision = revision;
    this.createdAt = createdAt;
    this.amount = amount;
    this.graceDays = graceDays;
    this.attributes = attributes;
    this.pinned = pinned;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictBidRuleThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictBidRuleThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict bid rule threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"strict bid rule threshold"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round((this.margin + this.graceDays) * 100) / 100;
  }

  copy(): StrictBidRuleThreshold {
    return new StrictBidRuleThreshold(
      this.code,
      this.name,
      this.margin,
      this.revision,
      this.createdAt,
      this.amount,
      this.graceDays,
      this.attributes,
      this.pinned,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict bid rule threshold in status new. */
export function newStrictBidRuleThreshold(code: string, name: string): StrictBidRuleThreshold {
  return new StrictBidRuleThreshold(code, name, 0, 0, 0, 0, 0, new Map<string, string>(), false, "", "new");
}
