import * as text from "../../../../kit/text.js";

/** Where a weighted touchpoint assignment is in its life cycle. */
export type WeightedTouchpointAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted touchpoint assignment as the touchpoint team keeps it. */
export class WeightedTouchpointAssignment {
  code: string;
  label: string;
  contactEmail: string;
  segment: string;
  unit: string;
  quantity: number;
  status: WeightedTouchpointAssignmentStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    segment: string,
    unit: string,
    quantity: number,
    status: WeightedTouchpointAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.segment = segment;
    this.unit = unit;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedTouchpointAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedTouchpointAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted touchpoint assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted touchpoint assignment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): WeightedTouchpointAssignment {
    return new WeightedTouchpointAssignment(
      this.code,
      this.label,
      this.contactEmail,
      this.segment,
      this.unit,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted touchpoint assignment in status requested. */
export function newWeightedTouchpointAssignment(code: string, label: string): WeightedTouchpointAssignment {
  return new WeightedTouchpointAssignment(code, label, "", "", "", 0, "requested");
}
