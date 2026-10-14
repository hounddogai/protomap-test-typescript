import * as text from "../../../../kit/text.js";

/** Where a funnel segment is in its life cycle. */
export type FunnelSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One funnel segment, with what the planners need to act on it. */
export class FunnelSegment {
  code: string;
  label: string;
  externalRef: string;
  category: string;
  region: string;
  floorValue: number;
  status: FunnelSegmentStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    category: string,
    region: string,
    floorValue: number,
    status: FunnelSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.category = category;
    this.region = region;
    this.floorValue = floorValue;
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

  canMoveTo(next: FunnelSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): FunnelSegment {
    return new FunnelSegment(
      this.code,
      this.label,
      this.externalRef,
      this.category,
      this.region,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a funnel segment in status proposed. */
export function newFunnelSegment(code: string, label: string): FunnelSegment {
  return new FunnelSegment(code, label, "", "", "", 0, "proposed");
}
