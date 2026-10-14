import * as text from "../../../../kit/text.js";

/** Where a legacy macro plan is in its life cycle. */
export type LegacyMacroPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy macro plan as the macro team keeps it. */
export class LegacyMacroPlan {
  code: string;
  name: string;
  archived: boolean;
  maximum: number;
  frequencyCap: number;
  floorValue: number;
  country: string;
  status: LegacyMacroPlanStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    maximum: number,
    frequencyCap: number,
    floorValue: number,
    country: string,
    status: LegacyMacroPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.maximum = maximum;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.country = country;
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

  canMoveTo(next: LegacyMacroPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: LegacyMacroPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy macro plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy macro plan"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.frequencyCap - this.floorValue) * 100) / 100;
  }

  copy(): LegacyMacroPlan {
    return new LegacyMacroPlan(
      this.code,
      this.name,
      this.archived,
      this.maximum,
      this.frequencyCap,
      this.floorValue,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy macro plan in status proposed. */
export function newLegacyMacroPlan(code: string, name: string): LegacyMacroPlan {
  return new LegacyMacroPlan(code, name, false, 0, 0, 0, "", "proposed");
}
