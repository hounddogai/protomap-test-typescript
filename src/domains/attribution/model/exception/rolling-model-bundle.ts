import * as text from "../../../../kit/text.js";

/** Where a rolling model bundle is in its life cycle. */
export type RollingModelBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One rolling model bundle, with what the planners need to act on it. */
export class RollingModelBundle {
  code: string;
  label: string;
  capacity: number;
  retries: number;
  conversionRate: number;
  archived: boolean;
  limit: number;
  priority: number;
  source: string;
  rate: number;
  status: RollingModelBundleStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    retries: number,
    conversionRate: number,
    archived: boolean,
    limit: number,
    priority: number,
    source: string,
    rate: number,
    status: RollingModelBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.limit = limit;
    this.priority = priority;
    this.source = source;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingModelBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingModelBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling model bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.rate + this.retries) * 100) / 100;
  }

  copy(): RollingModelBundle {
    return new RollingModelBundle(
      this.code,
      this.label,
      this.capacity,
      this.retries,
      this.conversionRate,
      this.archived,
      this.limit,
      this.priority,
      this.source,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling model bundle in status new. */
export function newRollingModelBundle(code: string, label: string): RollingModelBundle {
  return new RollingModelBundle(code, label, 0, 0, 0, false, 0, 0, "", 0, "new");
}
