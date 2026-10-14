import * as text from "../../../../kit/text.js";

/** Where a primary funnel target is in its life cycle. */
export type PrimaryFunnelTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary funnel target as the funnel team keeps it. */
export class PrimaryFunnelTarget {
  code: string;
  label: string;
  archived: boolean;
  ceiling: number;
  ownerId: string;
  amount: number;
  source: string;
  status: PrimaryFunnelTargetStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    ceiling: number,
    ownerId: string,
    amount: number,
    source: string,
    status: PrimaryFunnelTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.ceiling = ceiling;
    this.ownerId = ownerId;
    this.amount = amount;
    this.source = source;
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

  canMoveTo(next: PrimaryFunnelTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryFunnelTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary funnel target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round(this.amount * this.ceiling * 100) / 100;
  }

  copy(): PrimaryFunnelTarget {
    return new PrimaryFunnelTarget(
      this.code,
      this.label,
      this.archived,
      this.ceiling,
      this.ownerId,
      this.amount,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary funnel target in status proposed. */
export function newPrimaryFunnelTarget(code: string, label: string): PrimaryFunnelTarget {
  return new PrimaryFunnelTarget(code, label, false, 0, "", 0, "", "proposed");
}
