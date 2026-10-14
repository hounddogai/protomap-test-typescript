import * as text from "../../../../kit/text.js";

/** Where a capped retention allocation is in its life cycle. */
export type CappedRetentionAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a capped retention allocation and its current status. */
export class CappedRetentionAllocation {
  code: string;
  label: string;
  archived: boolean;
  quantity: number;
  durationMinutes: number;
  audienceId: string;
  reviewer: string;
  journeyId: string;
  attributes: Map<string, string>;
  ceiling: number;
  status: CappedRetentionAllocationStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    quantity: number,
    durationMinutes: number,
    audienceId: string,
    reviewer: string,
    journeyId: string,
    attributes: Map<string, string>,
    ceiling: number,
    status: CappedRetentionAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.reviewer = reviewer;
    this.journeyId = journeyId;
    this.attributes = attributes;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedRetentionAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CappedRetentionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped retention allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round(this.quantity * this.ceiling * 100) / 100;
  }

  copy(): CappedRetentionAllocation {
    return new CappedRetentionAllocation(
      this.code,
      this.label,
      this.archived,
      this.quantity,
      this.durationMinutes,
      this.audienceId,
      this.reviewer,
      this.journeyId,
      this.attributes,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped retention allocation in status requested. */
export function newCappedRetentionAllocation(code: string, label: string): CappedRetentionAllocation {
  return new CappedRetentionAllocation(code, label, false, 0, 0, "", "", "", new Map<string, string>(), 0, "requested");
}
