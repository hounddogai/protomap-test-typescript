import * as text from "../../../../kit/text.js";

/** Where a weighted retention slot is in its life cycle. */
export type WeightedRetentionSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted retention slot. Its code is unique within a tenant. */
export class WeightedRetentionSlot {
  code: string;
  label: string;
  version: number;
  margin: number;
  contactEmail: string;
  batchSize: number;
  retries: number;
  status: WeightedRetentionSlotStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    margin: number,
    contactEmail: string,
    batchSize: number,
    retries: number,
    status: WeightedRetentionSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.margin = margin;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.retries = retries;
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

  canMoveTo(next: WeightedRetentionSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedRetentionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted retention slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.batchSize - this.version) * 100) / 100;
  }

  copy(): WeightedRetentionSlot {
    return new WeightedRetentionSlot(
      this.code,
      this.label,
      this.version,
      this.margin,
      this.contactEmail,
      this.batchSize,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted retention slot in status open. */
export function newWeightedRetentionSlot(code: string, label: string): WeightedRetentionSlot {
  return new WeightedRetentionSlot(code, label, 0, 0, "", 0, 0, "open");
}
