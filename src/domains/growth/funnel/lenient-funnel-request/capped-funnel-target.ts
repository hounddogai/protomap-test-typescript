import * as text from "../../../../kit/text.js";

/** Where a capped funnel target is in its life cycle. */
export type CappedFunnelTargetStatus = "created" | "validated" | "published" | "retired";

/** A capped funnel target as the funnel team keeps it. */
export class CappedFunnelTarget {
  code: string;
  label: string;
  revision: number;
  windowDays: number;
  budget: number;
  margin: number;
  status: CappedFunnelTargetStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    windowDays: number,
    budget: number,
    margin: number,
    status: CappedFunnelTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.windowDays = windowDays;
    this.budget = budget;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFunnelTargetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedFunnelTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped funnel target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round((this.revision + this.margin) * 100) / 100;
  }

  copy(): CappedFunnelTarget {
    return new CappedFunnelTarget(
      this.code,
      this.label,
      this.revision,
      this.windowDays,
      this.budget,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped funnel target in status created. */
export function newCappedFunnelTarget(code: string, label: string): CappedFunnelTarget {
  return new CappedFunnelTarget(code, label, 0, 0, 0, 0, "created");
}
