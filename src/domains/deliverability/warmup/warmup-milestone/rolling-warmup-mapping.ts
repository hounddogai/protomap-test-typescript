import * as text from "../../../../kit/text.js";

/** Where a rolling warmup mapping is in its life cycle. */
export type RollingWarmupMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling warmup mapping. Its code is unique within a tenant. */
export class RollingWarmupMapping {
  code: string;
  label: string;
  attributes: Map<string, string>;
  limit: number;
  sequence: number;
  budget: number;
  status: RollingWarmupMappingStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    limit: number,
    sequence: number,
    budget: number,
    status: RollingWarmupMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.limit = limit;
    this.sequence = sequence;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingWarmupMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingWarmupMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling warmup mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round((this.sequence - this.budget) * 100) / 100;
  }

  copy(): RollingWarmupMapping {
    return new RollingWarmupMapping(
      this.code,
      this.label,
      this.attributes,
      this.limit,
      this.sequence,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling warmup mapping in status open. */
export function newRollingWarmupMapping(code: string, label: string): RollingWarmupMapping {
  return new RollingWarmupMapping(code, label, new Map<string, string>(), 0, 0, 0, "open");
}
