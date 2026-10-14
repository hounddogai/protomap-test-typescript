import * as text from "../../../../kit/text.js";

/** Where a seasonal queue baseline is in its life cycle. */
export type SeasonalQueueBaselineStatus = "created" | "validated" | "published" | "retired";

/** A seasonal queue baseline. Its code is unique within a tenant. */
export class SeasonalQueueBaseline {
  code: string;
  label: string;
  bid: number;
  tags: string[];
  externalRef: string;
  ratio: number;
  status: SeasonalQueueBaselineStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    tags: string[],
    externalRef: string,
    ratio: number,
    status: SeasonalQueueBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.tags = tags;
    this.externalRef = externalRef;
    this.ratio = ratio;
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

  canMoveTo(next: SeasonalQueueBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SeasonalQueueBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal queue baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal queue baseline"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round(this.bid * this.ratio * 100) / 100;
  }

  copy(): SeasonalQueueBaseline {
    return new SeasonalQueueBaseline(
      this.code,
      this.label,
      this.bid,
      this.tags,
      this.externalRef,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal queue baseline in status created. */
export function newSeasonalQueueBaseline(code: string, label: string): SeasonalQueueBaseline {
  return new SeasonalQueueBaseline(code, label, 0, [], "", 0, "created");
}
