import * as text from "../../../../kit/text.js";

/** Where a primary cohort rollup is in its life cycle. */
export type PrimaryCohortRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary cohort rollup. Its code is unique within a tenant. */
export class PrimaryCohortRollup {
  code: string;
  label: string;
  limit: number;
  unit: string;
  source: string;
  locale: string;
  journeyId: string;
  summary: string;
  graceDays: number;
  segment: string;
  tags: string[];
  status: PrimaryCohortRollupStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    unit: string,
    source: string,
    locale: string,
    journeyId: string,
    summary: string,
    graceDays: number,
    segment: string,
    tags: string[],
    status: PrimaryCohortRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.unit = unit;
    this.source = source;
    this.locale = locale;
    this.journeyId = journeyId;
    this.summary = summary;
    this.graceDays = graceDays;
    this.segment = segment;
    this.tags = tags;
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

  canMoveTo(next: PrimaryCohortRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryCohortRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary cohort rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.limit + this.graceDays) * 100) / 100;
  }

  copy(): PrimaryCohortRollup {
    return new PrimaryCohortRollup(
      this.code,
      this.label,
      this.limit,
      this.unit,
      this.source,
      this.locale,
      this.journeyId,
      this.summary,
      this.graceDays,
      this.segment,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary cohort rollup in status requested. */
export function newPrimaryCohortRollup(code: string, label: string): PrimaryCohortRollup {
  return new PrimaryCohortRollup(code, label, 0, "", "", "", "", "", 0, "", [], "requested");
}
