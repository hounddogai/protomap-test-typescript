/**
 * The model assignment records of attribution's model work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model assignment is in its life cycle. */
export type ModelAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A model assignment as the model team keeps it. */
export class ModelAssignment {
  code: string;
  label: string;
  utmSource: string;
  region: string;
  country: string;
  description: string;
  updatedAt: number;
  status: ModelAssignmentStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    region: string,
    country: string,
    description: string,
    updatedAt: number,
    status: ModelAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.region = region;
    this.country = country;
    this.description = description;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: ModelAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ModelAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): ModelAssignment {
    return new ModelAssignment(
      this.code,
      this.label,
      this.utmSource,
      this.region,
      this.country,
      this.description,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a model assignment in status proposed. */
export function newModelAssignment(code: string, label: string): ModelAssignment {
  return new ModelAssignment(code, label, "", "", "", "", 0, "proposed");
}
