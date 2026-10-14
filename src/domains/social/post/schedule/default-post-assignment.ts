import * as text from "../../../../kit/text.js";

/** Where a default post assignment is in its life cycle. */
export type DefaultPostAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default post assignment as the post team keeps it. */
export class DefaultPostAssignment {
  code: string;
  name: string;
  rate: number;
  margin: number;
  pinned: boolean;
  currency: string;
  updatedAt: number;
  label: string;
  variant: string;
  maximum: number;
  locale: string;
  status: DefaultPostAssignmentStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    margin: number,
    pinned: boolean,
    currency: string,
    updatedAt: number,
    label: string,
    variant: string,
    maximum: number,
    locale: string,
    status: DefaultPostAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.margin = margin;
    this.pinned = pinned;
    this.currency = currency;
    this.updatedAt = updatedAt;
    this.label = label;
    this.variant = variant;
    this.maximum = maximum;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultPostAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultPostAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default post assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.maximum + this.margin) * 100) / 100;
  }

  copy(): DefaultPostAssignment {
    return new DefaultPostAssignment(
      this.code,
      this.name,
      this.rate,
      this.margin,
      this.pinned,
      this.currency,
      this.updatedAt,
      this.label,
      this.variant,
      this.maximum,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default post assignment in status draft. */
export function newDefaultPostAssignment(code: string, name: string): DefaultPostAssignment {
  return new DefaultPostAssignment(code, name, 0, 0, false, "", 0, "", "", 0, "", "draft");
}
