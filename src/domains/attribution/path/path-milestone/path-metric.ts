import * as text from "../../../../kit/text.js";

/** Where a path metric is in its life cycle. */
export type PathMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** A path metric. Its code is unique within a tenant. */
export class PathMetric {
  code: string;
  name: string;
  capacity: number;
  floorValue: number;
  windowDays: number;
  budget: number;
  tags: string[];
  pinned: boolean;
  status: PathMetricStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    floorValue: number,
    windowDays: number,
    budget: number,
    tags: string[],
    pinned: boolean,
    status: PathMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.budget = budget;
    this.tags = tags;
    this.pinned = pinned;
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

  canMoveTo(next: PathMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"path metric"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.capacity * this.budget * 100) / 100;
  }

  copy(): PathMetric {
    return new PathMetric(
      this.code,
      this.name,
      this.capacity,
      this.floorValue,
      this.windowDays,
      this.budget,
      this.tags,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a path metric in status requested. */
export function newPathMetric(code: string, name: string): PathMetric {
  return new PathMetric(code, name, 0, 0, 0, 0, [], false, "requested");
}
