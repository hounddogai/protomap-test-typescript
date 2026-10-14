import * as text from "../../../../kit/text.js";

/** Where a tiered funnel mapping is in its life cycle. */
export type TieredFunnelMappingStatus = "created" | "validated" | "published" | "retired";

/** One tiered funnel mapping, with what the planners need to act on it. */
export class TieredFunnelMapping {
  code: string;
  name: string;
  cohort: string;
  revision: number;
  startsAt: number;
  reviewer: string;
  budget: number;
  unit: string;
  status: TieredFunnelMappingStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    revision: number,
    startsAt: number,
    reviewer: string,
    budget: number,
    unit: string,
    status: TieredFunnelMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.revision = revision;
    this.startsAt = startsAt;
    this.reviewer = reviewer;
    this.budget = budget;
    this.unit = unit;
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

  canMoveTo(next: TieredFunnelMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredFunnelMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered funnel mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"tiered funnel mapping"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.revision - this.startsAt) * 100) / 100;
  }

  copy(): TieredFunnelMapping {
    return new TieredFunnelMapping(
      this.code,
      this.name,
      this.cohort,
      this.revision,
      this.startsAt,
      this.reviewer,
      this.budget,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered funnel mapping in status created. */
export function newTieredFunnelMapping(code: string, name: string): TieredFunnelMapping {
  return new TieredFunnelMapping(code, name, "", 0, 0, "", 0, "", "created");
}
