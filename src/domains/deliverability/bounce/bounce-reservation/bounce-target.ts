import * as text from "../../../../kit/text.js";

/** Where a bounce target is in its life cycle. */
export type BounceTargetStatus = "created" | "validated" | "published" | "retired";

/** A bounce target as the bounce team keeps it. */
export class BounceTarget {
  code: string;
  label: string;
  expiresAt: number;
  margin: number;
  quantity: number;
  minimum: number;
  ratio: number;
  visible: boolean;
  status: BounceTargetStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    margin: number,
    quantity: number,
    minimum: number,
    ratio: number,
    visible: boolean,
    status: BounceTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.quantity = quantity;
    this.minimum = minimum;
    this.ratio = ratio;
    this.visible = visible;
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

  canMoveTo(next: BounceTargetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BounceTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"bounce target"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.ratio + this.minimum) * 100) / 100;
  }

  copy(): BounceTarget {
    return new BounceTarget(
      this.code,
      this.label,
      this.expiresAt,
      this.margin,
      this.quantity,
      this.minimum,
      this.ratio,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bounce target in status created. */
export function newBounceTarget(code: string, label: string): BounceTarget {
  return new BounceTarget(code, label, 0, 0, 0, 0, 0, false, "created");
}
