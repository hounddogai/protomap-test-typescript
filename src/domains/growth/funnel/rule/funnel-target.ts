import * as text from "../../../../kit/text.js";

/** Where a funnel target is in its life cycle. */
export type FunnelTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A funnel target as the funnel team keeps it. */
export class FunnelTarget {
  code: string;
  name: string;
  unit: string;
  source: string;
  expiresAt: number;
  status: FunnelTargetStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    source: string,
    expiresAt: number,
    status: FunnelTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.source = source;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: FunnelTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
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

  moveTo(next: FunnelTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"funnel target"} ${this.code}`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): FunnelTarget {
    return new FunnelTarget(this.code, this.name, this.unit, this.source, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a funnel target in status proposed. */
export function newFunnelTarget(code: string, name: string): FunnelTarget {
  return new FunnelTarget(code, name, "", "", 0, "proposed");
}
