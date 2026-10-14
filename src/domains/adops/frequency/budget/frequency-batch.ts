import * as text from "../../../../kit/text.js";

/** Where a frequency batch is in its life cycle. */
export type FrequencyBatchStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A frequency batch. Its code is unique within a tenant. */
export class FrequencyBatch {
  code: string;
  label: string;
  campaignRef: string;
  attributes: Map<string, string>;
  ownerId: string;
  quantity: number;
  status: FrequencyBatchStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    attributes: Map<string, string>,
    ownerId: string,
    quantity: number,
    status: FrequencyBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.attributes = attributes;
    this.ownerId = ownerId;
    this.quantity = quantity;
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

  canMoveTo(next: FrequencyBatchStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
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
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FrequencyBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): FrequencyBatch {
    return new FrequencyBatch(
      this.code,
      this.label,
      this.campaignRef,
      this.attributes,
      this.ownerId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a frequency batch in status open. */
export function newFrequencyBatch(code: string, label: string): FrequencyBatch {
  return new FrequencyBatch(code, label, "", new Map<string, string>(), "", 0, "open");
}
