import * as text from "../../../../kit/text.js";

/** Where a level metric is in its life cycle. */
export type LevelMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A level metric. Its code is unique within a tenant. */
export class LevelMetric {
  code: string;
  label: string;
  locale: string;
  startsAt: number;
  openRate: number;
  variant: string;
  windowDays: number;
  status: LevelMetricStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    startsAt: number,
    openRate: number,
    variant: string,
    windowDays: number,
    status: LevelMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.variant = variant;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LevelMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.windowDays * this.openRate * 100) / 100;
  }

  copy(): LevelMetric {
    return new LevelMetric(
      this.code,
      this.label,
      this.locale,
      this.startsAt,
      this.openRate,
      this.variant,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a level metric in status draft. */
export function newLevelMetric(code: string, label: string): LevelMetric {
  return new LevelMetric(code, label, "", 0, 0, "", 0, "draft");
}
