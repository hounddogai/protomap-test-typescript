import * as text from "../../../../kit/text.js";

/** Where a legacy window baseline is in its life cycle. */
export type LegacyWindowBaselineStatus = "created" | "validated" | "published" | "retired";

/** The record of a legacy window baseline and its current status. */
export class LegacyWindowBaseline {
  code: string;
  label: string;
  ratio: number;
  budget: number;
  utmSource: string;
  margin: number;
  category: string;
  channel: string;
  startsAt: number;
  source: string;
  status: LegacyWindowBaselineStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    budget: number,
    utmSource: string,
    margin: number,
    category: string,
    channel: string,
    startsAt: number,
    source: string,
    status: LegacyWindowBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.budget = budget;
    this.utmSource = utmSource;
    this.margin = margin;
    this.category = category;
    this.channel = channel;
    this.startsAt = startsAt;
    this.source = source;
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

  canMoveTo(next: LegacyWindowBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
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

  moveTo(next: LegacyWindowBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy window baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.budget + this.startsAt) * 100) / 100;
  }

  copy(): LegacyWindowBaseline {
    return new LegacyWindowBaseline(
      this.code,
      this.label,
      this.ratio,
      this.budget,
      this.utmSource,
      this.margin,
      this.category,
      this.channel,
      this.startsAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a legacy window baseline in status created. */
export function newLegacyWindowBaseline(code: string, label: string): LegacyWindowBaseline {
  return new LegacyWindowBaseline(code, label, 0, 0, "", 0, "", "", 0, "", "created");
}
