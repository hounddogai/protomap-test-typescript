import * as text from "../../../../kit/text.js";

/** Where a adaptive nudge mapping is in its life cycle. */
export type AdaptiveNudgeMappingStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive nudge mapping. Its code is unique within a tenant. */
export class AdaptiveNudgeMapping {
  code: string;
  name: string;
  variant: string;
  unit: string;
  threshold: number;
  status: AdaptiveNudgeMappingStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    unit: string,
    threshold: number,
    status: AdaptiveNudgeMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.unit = unit;
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

  canMoveTo(next: AdaptiveNudgeMappingStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: AdaptiveNudgeMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive nudge mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive nudge mapping"} ${this.code}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): AdaptiveNudgeMapping {
    return new AdaptiveNudgeMapping(this.code, this.name, this.variant, this.unit, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive nudge mapping in status new. */
export function newAdaptiveNudgeMapping(code: string, name: string): AdaptiveNudgeMapping {
  return new AdaptiveNudgeMapping(code, name, "", "", 0, "new");
}
