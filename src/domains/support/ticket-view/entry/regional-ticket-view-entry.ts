/**
 * The regional ticket view entry records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional ticket view entry is in its life cycle. */
export type RegionalTicketViewEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a regional ticket view entry and its current status. */
export class RegionalTicketViewEntry {
  code: string;
  title: string;
  attributes: Map<string, string>;
  tags: string[];
  createdAt: number;
  impressions: number;
  utmSource: string;
  currency: string;
  conversionRate: number;
  ratio: number;
  status: RegionalTicketViewEntryStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    tags: string[],
    createdAt: number,
    impressions: number,
    utmSource: string,
    currency: string,
    conversionRate: number,
    ratio: number,
    status: RegionalTicketViewEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.tags = tags;
    this.createdAt = createdAt;
    this.impressions = impressions;
    this.utmSource = utmSource;
    this.currency = currency;
    this.conversionRate = conversionRate;
    this.ratio = ratio;
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

  canMoveTo(next: RegionalTicketViewEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: RegionalTicketViewEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional ticket view entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
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

  effectiveValue(): number {
    return Math.round(this.impressions * this.createdAt * 100) / 100;
  }

  copy(): RegionalTicketViewEntry {
    return new RegionalTicketViewEntry(
      this.code,
      this.title,
      this.attributes,
      this.tags,
      this.createdAt,
      this.impressions,
      this.utmSource,
      this.currency,
      this.conversionRate,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a regional ticket view entry in status open. */
export function newRegionalTicketViewEntry(code: string, title: string): RegionalTicketViewEntry {
  return new RegionalTicketViewEntry(code, title, new Map<string, string>(), [], 0, 0, "", "", 0, 0, "open");
}
