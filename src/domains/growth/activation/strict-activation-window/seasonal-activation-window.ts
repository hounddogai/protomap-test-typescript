/**
 * The seasonal activation window records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal activation window is in its life cycle. */
export type SeasonalActivationWindowStatus = "created" | "validated" | "published" | "retired";

/** The record of a seasonal activation window and its current status. */
export class SeasonalActivationWindow {
  code: string;
  title: string;
  name: string;
  campaignRef: string;
  utmSource: string;
  currency: string;
  priority: number;
  sequence: number;
  attributes: Map<string, string>;
  status: SeasonalActivationWindowStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    campaignRef: string,
    utmSource: string,
    currency: string,
    priority: number,
    sequence: number,
    attributes: Map<string, string>,
    status: SeasonalActivationWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.campaignRef = campaignRef;
    this.utmSource = utmSource;
    this.currency = currency;
    this.priority = priority;
    this.sequence = sequence;
    this.attributes = attributes;
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

  canMoveTo(next: SeasonalActivationWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalActivationWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal activation window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal activation window"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round((this.priority + this.sequence) * 100) / 100;
  }

  copy(): SeasonalActivationWindow {
    return new SeasonalActivationWindow(
      this.code,
      this.title,
      this.name,
      this.campaignRef,
      this.utmSource,
      this.currency,
      this.priority,
      this.sequence,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a seasonal activation window in status created. */
export function newSeasonalActivationWindow(code: string, title: string): SeasonalActivationWindow {
  return new SeasonalActivationWindow(code, title, "", "", "", "", 0, 0, new Map<string, string>(), "created");
}
