import * as text from "../../../../kit/text.js";

/** Where a suppression estimate is in its life cycle. */
export type SuppressionEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a suppression estimate and its current status. */
export class SuppressionEstimate {
  code: string;
  name: string;
  utmSource: string;
  approved: boolean;
  version: number;
  description: string;
  status: SuppressionEstimateStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    approved: boolean,
    version: number,
    description: string,
    status: SuppressionEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.approved = approved;
    this.version = version;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): SuppressionEstimate {
    return new SuppressionEstimate(
      this.code,
      this.name,
      this.utmSource,
      this.approved,
      this.version,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a suppression estimate in status planned. */
export function newSuppressionEstimate(code: string, name: string): SuppressionEstimate {
  return new SuppressionEstimate(code, name, "", false, 0, "", "planned");
}
