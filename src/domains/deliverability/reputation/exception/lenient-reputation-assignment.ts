import * as text from "../../../../kit/text.js";

/** Where a lenient reputation assignment is in its life cycle. */
export type LenientReputationAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient reputation assignment and its current status. */
export class LenientReputationAssignment {
  code: string;
  name: string;
  weight: number;
  revision: number;
  openRate: number;
  durationMinutes: number;
  maximum: number;
  status: LenientReputationAssignmentStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    revision: number,
    openRate: number,
    durationMinutes: number,
    maximum: number,
    status: LenientReputationAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.revision = revision;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.maximum = maximum;
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

  canMoveTo(next: LenientReputationAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientReputationAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reputation assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round(this.maximum * this.openRate * 100) / 100;
  }

  copy(): LenientReputationAssignment {
    return new LenientReputationAssignment(
      this.code,
      this.name,
      this.weight,
      this.revision,
      this.openRate,
      this.durationMinutes,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient reputation assignment in status proposed. */
export function newLenientReputationAssignment(code: string, name: string): LenientReputationAssignment {
  return new LenientReputationAssignment(code, name, 0, 0, 0, 0, 0, "proposed");
}
