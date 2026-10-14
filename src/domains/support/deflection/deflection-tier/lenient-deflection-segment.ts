import * as text from "../../../../kit/text.js";

/** Where a lenient deflection segment is in its life cycle. */
export type LenientDeflectionSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient deflection segment and its current status. */
export class LenientDeflectionSegment {
  code: string;
  name: string;
  description: string;
  unit: string;
  floorValue: number;
  status: LenientDeflectionSegmentStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    unit: string,
    floorValue: number,
    status: LenientDeflectionSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.unit = unit;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientDeflectionSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientDeflectionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient deflection segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): LenientDeflectionSegment {
    return new LenientDeflectionSegment(
      this.code,
      this.name,
      this.description,
      this.unit,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient deflection segment in status idle. */
export function newLenientDeflectionSegment(code: string, name: string): LenientDeflectionSegment {
  return new LenientDeflectionSegment(code, name, "", "", 0, "idle");
}
