import * as text from "../../../../kit/text.js";

/** Where a fallback window baseline is in its life cycle. */
export type FallbackWindowBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback window baseline. Its code is unique within a tenant. */
export class FallbackWindowBaseline {
  code: string;
  label: string;
  region: string;
  ownerId: string;
  locale: string;
  threshold: number;
  status: FallbackWindowBaselineStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    ownerId: string,
    locale: string,
    threshold: number,
    status: FallbackWindowBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.ownerId = ownerId;
    this.locale = locale;
    this.threshold = threshold;
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

  canMoveTo(next: FallbackWindowBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackWindowBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback window baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): FallbackWindowBaseline {
    return new FallbackWindowBaseline(
      this.code,
      this.label,
      this.region,
      this.ownerId,
      this.locale,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a fallback window baseline in status new. */
export function newFallbackWindowBaseline(code: string, label: string): FallbackWindowBaseline {
  return new FallbackWindowBaseline(code, label, "", "", "", 0, "new");
}
