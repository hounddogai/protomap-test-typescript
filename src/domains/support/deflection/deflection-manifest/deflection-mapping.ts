import * as text from "../../../../kit/text.js";

/** Where a deflection mapping is in its life cycle. */
export type DeflectionMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A deflection mapping as the deflection team keeps it. */
export class DeflectionMapping {
  code: string;
  title: string;
  externalRef: string;
  sequence: number;
  durationMinutes: number;
  budget: number;
  graceDays: number;
  reviewer: string;
  approved: boolean;
  status: DeflectionMappingStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    sequence: number,
    durationMinutes: number,
    budget: number,
    graceDays: number,
    reviewer: string,
    approved: boolean,
    status: DeflectionMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.approved = approved;
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

  canMoveTo(next: DeflectionMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DeflectionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"deflection mapping"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.budget * this.sequence * 100) / 100;
  }

  copy(): DeflectionMapping {
    return new DeflectionMapping(
      this.code,
      this.title,
      this.externalRef,
      this.sequence,
      this.durationMinutes,
      this.budget,
      this.graceDays,
      this.reviewer,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a deflection mapping in status open. */
export function newDeflectionMapping(code: string, title: string): DeflectionMapping {
  return new DeflectionMapping(code, title, "", 0, 0, 0, 0, "", false, "open");
}
