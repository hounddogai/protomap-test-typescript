/**
 * The seasonal conversion group records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal conversion group is in its life cycle. */
export type SeasonalConversionGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal conversion group. Its code is unique within a tenant. */
export class SeasonalConversionGroup {
  code: string;
  name: string;
  batchSize: number;
  description: string;
  reviewer: string;
  status: SeasonalConversionGroupStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    description: string,
    reviewer: string,
    status: SeasonalConversionGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.description = description;
    this.reviewer = reviewer;
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

  canMoveTo(next: SeasonalConversionGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalConversionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal conversion group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): SeasonalConversionGroup {
    return new SeasonalConversionGroup(
      this.code,
      this.name,
      this.batchSize,
      this.description,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal conversion group in status proposed. */
export function newSeasonalConversionGroup(code: string, name: string): SeasonalConversionGroup {
  return new SeasonalConversionGroup(code, name, 0, "", "", "proposed");
}
