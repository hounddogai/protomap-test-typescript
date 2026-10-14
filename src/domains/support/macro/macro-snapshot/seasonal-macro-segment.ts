import * as text from "../../../../kit/text.js";

/** Where a seasonal macro segment is in its life cycle. */
export type SeasonalMacroSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal macro segment. Its code is unique within a tenant. */
export class SeasonalMacroSegment {
  code: string;
  name: string;
  phone: string;
  rate: number;
  source: string;
  segment: string;
  status: SeasonalMacroSegmentStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    rate: number,
    source: string,
    segment: string,
    status: SeasonalMacroSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.rate = rate;
    this.source = source;
    this.segment = segment;
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

  canMoveTo(next: SeasonalMacroSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalMacroSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal macro segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): SeasonalMacroSegment {
    return new SeasonalMacroSegment(
      this.code,
      this.name,
      this.phone,
      this.rate,
      this.source,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal macro segment in status idle. */
export function newSeasonalMacroSegment(code: string, name: string): SeasonalMacroSegment {
  return new SeasonalMacroSegment(code, name, "", 0, "", "", "idle");
}
