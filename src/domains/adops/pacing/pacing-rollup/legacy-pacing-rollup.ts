/**
 * The legacy pacing rollup records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy pacing rollup is in its life cycle. */
export type LegacyPacingRollupStatus = "created" | "validated" | "published" | "retired";

/** The record of a legacy pacing rollup and its current status. */
export class LegacyPacingRollup {
  code: string;
  label: string;
  archived: boolean;
  category: string;
  country: string;
  currency: string;
  bid: number;
  locale: string;
  status: LegacyPacingRollupStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    category: string,
    country: string,
    currency: string,
    bid: number,
    locale: string,
    status: LegacyPacingRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.category = category;
    this.country = country;
    this.currency = currency;
    this.bid = bid;
    this.locale = locale;
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

  canMoveTo(next: LegacyPacingRollupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
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

  moveTo(next: LegacyPacingRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy pacing rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy pacing rollup"} ${this.code}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): LegacyPacingRollup {
    return new LegacyPacingRollup(
      this.code,
      this.label,
      this.archived,
      this.category,
      this.country,
      this.currency,
      this.bid,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy pacing rollup in status created. */
export function newLegacyPacingRollup(code: string, label: string): LegacyPacingRollup {
  return new LegacyPacingRollup(code, label, false, "", "", "", 0, "", "created");
}
