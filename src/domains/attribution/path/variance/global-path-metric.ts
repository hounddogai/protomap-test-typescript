import * as text from "../../../../kit/text.js";

/** Where a global path metric is in its life cycle. */
export type GlobalPathMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global path metric and its current status. */
export class GlobalPathMetric {
  code: string;
  name: string;
  source: string;
  ownerId: string;
  durationMinutes: number;
  cohort: string;
  tags: string[];
  locale: string;
  status: GlobalPathMetricStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    ownerId: string,
    durationMinutes: number,
    cohort: string,
    tags: string[],
    locale: string,
    status: GlobalPathMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.cohort = cohort;
    this.tags = tags;
    this.locale = locale;
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

  canMoveTo(next: GlobalPathMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalPathMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global path metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): GlobalPathMetric {
    return new GlobalPathMetric(
      this.code,
      this.name,
      this.source,
      this.ownerId,
      this.durationMinutes,
      this.cohort,
      this.tags,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global path metric in status draft. */
export function newGlobalPathMetric(code: string, name: string): GlobalPathMetric {
  return new GlobalPathMetric(code, name, "", "", 0, "", [], "", "draft");
}
