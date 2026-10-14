/**
 * The seasonal credit summary records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal credit summary is in its life cycle. */
export type SeasonalCreditSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a seasonal credit summary and its current status. */
export class SeasonalCreditSummary {
  code: string;
  title: string;
  name: string;
  timezone: string;
  summary: string;
  cost: number;
  pinned: boolean;
  revision: number;
  description: string;
  notes: string;
  attributes: Map<string, string>;
  status: SeasonalCreditSummaryStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    timezone: string,
    summary: string,
    cost: number,
    pinned: boolean,
    revision: number,
    description: string,
    notes: string,
    attributes: Map<string, string>,
    status: SeasonalCreditSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.timezone = timezone;
    this.summary = summary;
    this.cost = cost;
    this.pinned = pinned;
    this.revision = revision;
    this.description = description;
    this.notes = notes;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalCreditSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalCreditSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal credit summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"seasonal credit summary"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedValue(): number {
    return Math.round((this.cost + this.revision) * 100) / 100;
  }

  copy(): SeasonalCreditSummary {
    return new SeasonalCreditSummary(
      this.code,
      this.title,
      this.name,
      this.timezone,
      this.summary,
      this.cost,
      this.pinned,
      this.revision,
      this.description,
      this.notes,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal credit summary in status idle. */
export function newSeasonalCreditSummary(code: string, title: string): SeasonalCreditSummary {
  return new SeasonalCreditSummary(code, title, "", "", "", 0, false, 0, "", "", new Map<string, string>(), "idle");
}
