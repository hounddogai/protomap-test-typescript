/**
 * The model mapping records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model mapping is in its life cycle. */
export type ModelMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One model mapping, with what the planners need to act on it. */
export class ModelMapping {
  code: string;
  label: string;
  pinned: boolean;
  approved: boolean;
  category: string;
  ratio: number;
  cohort: string;
  status: ModelMappingStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    approved: boolean,
    category: string,
    ratio: number,
    cohort: string,
    status: ModelMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.approved = approved;
    this.category = category;
    this.ratio = ratio;
    this.cohort = cohort;
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

  canMoveTo(next: ModelMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): ModelMapping {
    return new ModelMapping(
      this.code,
      this.label,
      this.pinned,
      this.approved,
      this.category,
      this.ratio,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a model mapping in status proposed. */
export function newModelMapping(code: string, label: string): ModelMapping {
  return new ModelMapping(code, label, false, false, "", 0, "", "proposed");
}
