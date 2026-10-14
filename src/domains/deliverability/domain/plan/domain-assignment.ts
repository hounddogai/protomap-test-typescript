import * as text from "../../../../kit/text.js";

/** Where a domain assignment is in its life cycle. */
export type DomainAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A domain assignment. Its code is unique within a tenant. */
export class DomainAssignment {
  code: string;
  label: string;
  durationMinutes: number;
  quantity: number;
  maximum: number;
  ratio: number;
  weight: number;
  status: DomainAssignmentStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    quantity: number,
    maximum: number,
    ratio: number,
    weight: number,
    status: DomainAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.quantity = quantity;
    this.maximum = maximum;
    this.ratio = ratio;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DomainAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DomainAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round(this.maximum * this.weight * 100) / 100;
  }

  copy(): DomainAssignment {
    return new DomainAssignment(
      this.code,
      this.label,
      this.durationMinutes,
      this.quantity,
      this.maximum,
      this.ratio,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a domain assignment in status open. */
export function newDomainAssignment(code: string, label: string): DomainAssignment {
  return new DomainAssignment(code, label, 0, 0, 0, 0, 0, "open");
}
