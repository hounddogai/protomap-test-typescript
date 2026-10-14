import * as text from "../../../../kit/text.js";

/** Where a fallback wait mapping is in its life cycle. */
export type FallbackWaitMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fallback wait mapping and its current status. */
export class FallbackWaitMapping {
  code: string;
  label: string;
  budget: number;
  archived: boolean;
  clicks: number;
  segment: string;
  status: FallbackWaitMappingStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    archived: boolean,
    clicks: number,
    segment: string,
    status: FallbackWaitMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.archived = archived;
    this.clicks = clicks;
    this.segment = segment;
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

  canMoveTo(next: FallbackWaitMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
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

  moveTo(next: FallbackWaitMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback wait mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback wait mapping"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.budget * this.clicks * 100) / 100;
  }

  copy(): FallbackWaitMapping {
    return new FallbackWaitMapping(
      this.code,
      this.label,
      this.budget,
      this.archived,
      this.clicks,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback wait mapping in status proposed. */
export function newFallbackWaitMapping(code: string, label: string): FallbackWaitMapping {
  return new FallbackWaitMapping(code, label, 0, false, 0, "", "proposed");
}
