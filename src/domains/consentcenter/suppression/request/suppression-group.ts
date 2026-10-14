import * as text from "../../../../kit/text.js";

/** Where a suppression group is in its life cycle. */
export type SuppressionGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One suppression group, with what the planners need to act on it. */
export class SuppressionGroup {
  code: string;
  name: string;
  durationMinutes: number;
  version: number;
  reviewer: string;
  externalRef: string;
  approved: boolean;
  unit: string;
  label: string;
  status: SuppressionGroupStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    version: number,
    reviewer: string,
    externalRef: string,
    approved: boolean,
    unit: string,
    label: string,
    status: SuppressionGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.version = version;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.approved = approved;
    this.unit = unit;
    this.label = label;
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

  canMoveTo(next: SuppressionGroupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SuppressionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.durationMinutes + this.version) * 100) / 100;
  }

  copy(): SuppressionGroup {
    return new SuppressionGroup(
      this.code,
      this.name,
      this.durationMinutes,
      this.version,
      this.reviewer,
      this.externalRef,
      this.approved,
      this.unit,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a suppression group in status open. */
export function newSuppressionGroup(code: string, name: string): SuppressionGroup {
  return new SuppressionGroup(code, name, 0, 0, "", "", false, "", "", "open");
}
