import * as text from "../../../../kit/text.js";

/** Where a fallback conversion mapping is in its life cycle. */
export type FallbackConversionMappingStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback conversion mapping as the conversion team keeps it. */
export class FallbackConversionMapping {
  code: string;
  name: string;
  threshold: number;
  attempts: number;
  attributes: Map<string, string>;
  status: FallbackConversionMappingStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    attempts: number,
    attributes: Map<string, string>,
    status: FallbackConversionMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.attempts = attempts;
    this.attributes = attributes;
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

  canMoveTo(next: FallbackConversionMappingStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackConversionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback conversion mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback conversion mapping"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round(this.threshold * this.attempts * 100) / 100;
  }

  copy(): FallbackConversionMapping {
    return new FallbackConversionMapping(
      this.code,
      this.name,
      this.threshold,
      this.attempts,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback conversion mapping in status new. */
export function newFallbackConversionMapping(code: string, name: string): FallbackConversionMapping {
  return new FallbackConversionMapping(code, name, 0, 0, new Map<string, string>(), "new");
}
