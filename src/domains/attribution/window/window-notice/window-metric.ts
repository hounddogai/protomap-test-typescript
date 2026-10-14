import * as text from "../../../../kit/text.js";

/** Where a window metric is in its life cycle. */
export type WindowMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A window metric. Its code is unique within a tenant. */
export class WindowMetric {
  code: string;
  name: string;
  version: number;
  weight: number;
  audienceId: string;
  capacity: number;
  tags: string[];
  status: WindowMetricStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    weight: number,
    audienceId: string,
    capacity: number,
    tags: string[],
    status: WindowMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.weight = weight;
    this.audienceId = audienceId;
    this.capacity = capacity;
    this.tags = tags;
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

  canMoveTo(next: WindowMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WindowMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
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

  effectiveTotal(): number {
    return Math.round((this.version + this.capacity) * 100) / 100;
  }

  copy(): WindowMetric {
    return new WindowMetric(
      this.code,
      this.name,
      this.version,
      this.weight,
      this.audienceId,
      this.capacity,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a window metric in status planned. */
export function newWindowMetric(code: string, name: string): WindowMetric {
  return new WindowMetric(code, name, 0, 0, "", 0, [], "planned");
}
