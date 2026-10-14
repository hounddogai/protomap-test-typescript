/**
 * The capped bid rule cycle records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped bid rule cycle is in its life cycle. */
export type CappedBidRuleCycleStatus = "created" | "validated" | "published" | "retired";

/** A capped bid rule cycle as the bid rule team keeps it. */
export class CappedBidRuleCycle {
  code: string;
  name: string;
  capacity: number;
  locale: string;
  attributes: Map<string, string>;
  openRate: number;
  createdAt: number;
  summary: string;
  version: number;
  status: CappedBidRuleCycleStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    locale: string,
    attributes: Map<string, string>,
    openRate: number,
    createdAt: number,
    summary: string,
    version: number,
    status: CappedBidRuleCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.locale = locale;
    this.attributes = attributes;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.summary = summary;
    this.version = version;
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

  canMoveTo(next: CappedBidRuleCycleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedBidRuleCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped bid rule cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
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

  netVolume(): number {
    return Math.round(this.version * this.openRate * 100) / 100;
  }

  copy(): CappedBidRuleCycle {
    return new CappedBidRuleCycle(
      this.code,
      this.name,
      this.capacity,
      this.locale,
      this.attributes,
      this.openRate,
      this.createdAt,
      this.summary,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped bid rule cycle in status created. */
export function newCappedBidRuleCycle(code: string, name: string): CappedBidRuleCycle {
  return new CappedBidRuleCycle(code, name, 0, "", new Map<string, string>(), 0, 0, "", 0, "created");
}
