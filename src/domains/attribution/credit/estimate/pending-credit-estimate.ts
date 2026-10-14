import * as text from "../../../../kit/text.js";

/** Where a pending credit estimate is in its life cycle. */
export type PendingCreditEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a pending credit estimate and its current status. */
export class PendingCreditEstimate {
  code: string;
  label: string;
  channel: string;
  active: boolean;
  attributes: Map<string, string>;
  quantity: number;
  status: PendingCreditEstimateStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    active: boolean,
    attributes: Map<string, string>,
    quantity: number,
    status: PendingCreditEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.active = active;
    this.attributes = attributes;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingCreditEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCreditEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending credit estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending credit estimate"} ${this.code}`;
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

  copy(): PendingCreditEstimate {
    return new PendingCreditEstimate(
      this.code,
      this.label,
      this.channel,
      this.active,
      this.attributes,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending credit estimate in status new. */
export function newPendingCreditEstimate(code: string, label: string): PendingCreditEstimate {
  return new PendingCreditEstimate(code, label, "", false, new Map<string, string>(), 0, "new");
}
