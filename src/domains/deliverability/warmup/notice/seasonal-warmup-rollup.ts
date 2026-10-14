import * as text from "../../../../kit/text.js";

/** Where a seasonal warmup rollup is in its life cycle. */
export type SeasonalWarmupRollupStatus = "created" | "validated" | "published" | "retired";

/** A seasonal warmup rollup as the warmup team keeps it. */
export class SeasonalWarmupRollup {
  code: string;
  name: string;
  title: string;
  visible: boolean;
  limit: number;
  version: number;
  openRate: number;
  externalRef: string;
  status: SeasonalWarmupRollupStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    visible: boolean,
    limit: number,
    version: number,
    openRate: number,
    externalRef: string,
    status: SeasonalWarmupRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.visible = visible;
    this.limit = limit;
    this.version = version;
    this.openRate = openRate;
    this.externalRef = externalRef;
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

  canMoveTo(next: SeasonalWarmupRollupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SeasonalWarmupRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal warmup rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round((this.version + this.openRate) * 100) / 100;
  }

  copy(): SeasonalWarmupRollup {
    return new SeasonalWarmupRollup(
      this.code,
      this.name,
      this.title,
      this.visible,
      this.limit,
      this.version,
      this.openRate,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal warmup rollup in status created. */
export function newSeasonalWarmupRollup(code: string, name: string): SeasonalWarmupRollup {
  return new SeasonalWarmupRollup(code, name, "", false, 0, 0, 0, "", "created");
}
