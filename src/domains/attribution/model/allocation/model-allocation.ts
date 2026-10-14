/**
 * The model allocation records of attribution's model work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model allocation is in its life cycle. */
export type ModelAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One model allocation, with what the planners need to act on it. */
export class ModelAllocation {
  code: string;
  label: string;
  ownerId: string;
  category: string;
  reviewer: string;
  visible: boolean;
  capacity: number;
  locale: string;
  weight: number;
  status: ModelAllocationStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    category: string,
    reviewer: string,
    visible: boolean,
    capacity: number,
    locale: string,
    weight: number,
    status: ModelAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.category = category;
    this.reviewer = reviewer;
    this.visible = visible;
    this.capacity = capacity;
    this.locale = locale;
    this.weight = weight;
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

  canMoveTo(next: ModelAllocationStatus): boolean {
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
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ModelAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round(this.capacity * this.weight * 100) / 100;
  }

  copy(): ModelAllocation {
    return new ModelAllocation(
      this.code,
      this.label,
      this.ownerId,
      this.category,
      this.reviewer,
      this.visible,
      this.capacity,
      this.locale,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a model allocation in status proposed. */
export function newModelAllocation(code: string, label: string): ModelAllocation {
  return new ModelAllocation(code, label, "", "", "", false, 0, "", 0, "proposed");
}
