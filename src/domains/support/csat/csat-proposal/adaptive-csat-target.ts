import * as text from "../../../../kit/text.js";

/** Where a adaptive csat target is in its life cycle. */
export type AdaptiveCsatTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One adaptive csat target, with what the planners need to act on it. */
export class AdaptiveCsatTarget {
  code: string;
  name: string;
  version: number;
  ratio: number;
  tags: string[];
  limit: number;
  timezone: string;
  createdAt: number;
  openRate: number;
  status: AdaptiveCsatTargetStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    ratio: number,
    tags: string[],
    limit: number,
    timezone: string,
    createdAt: number,
    openRate: number,
    status: AdaptiveCsatTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.ratio = ratio;
    this.tags = tags;
    this.limit = limit;
    this.timezone = timezone;
    this.createdAt = createdAt;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveCsatTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveCsatTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive csat target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"adaptive csat target"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.ratio * this.version * 100) / 100;
  }

  copy(): AdaptiveCsatTarget {
    return new AdaptiveCsatTarget(
      this.code,
      this.name,
      this.version,
      this.ratio,
      this.tags,
      this.limit,
      this.timezone,
      this.createdAt,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive csat target in status planned. */
export function newAdaptiveCsatTarget(code: string, name: string): AdaptiveCsatTarget {
  return new AdaptiveCsatTarget(code, name, 0, 0, [], 0, "", 0, 0, "planned");
}
