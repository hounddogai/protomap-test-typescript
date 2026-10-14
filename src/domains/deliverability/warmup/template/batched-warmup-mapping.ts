import * as text from "../../../../kit/text.js";

/** Where a batched warmup mapping is in its life cycle. */
export type BatchedWarmupMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched warmup mapping as the warmup team keeps it. */
export class BatchedWarmupMapping {
  code: string;
  title: string;
  attributes: Map<string, string>;
  retries: number;
  version: number;
  rate: number;
  priority: number;
  label: string;
  visible: boolean;
  status: BatchedWarmupMappingStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    retries: number,
    version: number,
    rate: number,
    priority: number,
    label: string,
    visible: boolean,
    status: BatchedWarmupMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.retries = retries;
    this.version = version;
    this.rate = rate;
    this.priority = priority;
    this.label = label;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedWarmupMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedWarmupMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched warmup mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round((this.version + this.priority) * 100) / 100;
  }

  copy(): BatchedWarmupMapping {
    return new BatchedWarmupMapping(
      this.code,
      this.title,
      this.attributes,
      this.retries,
      this.version,
      this.rate,
      this.priority,
      this.label,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched warmup mapping in status proposed. */
export function newBatchedWarmupMapping(code: string, title: string): BatchedWarmupMapping {
  return new BatchedWarmupMapping(code, title, new Map<string, string>(), 0, 0, 0, 0, "", false, "proposed");
}
