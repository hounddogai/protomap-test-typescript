import * as text from "../../../../kit/text.js";

/** Where a batched queue agreement is in its life cycle. */
export type BatchedQueueAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched queue agreement. Its code is unique within a tenant. */
export class BatchedQueueAgreement {
  code: string;
  name: string;
  cohort: string;
  updatedAt: number;
  windowDays: number;
  sequence: number;
  weight: number;
  unit: string;
  pinned: boolean;
  attributes: Map<string, string>;
  revision: number;
  status: BatchedQueueAgreementStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    updatedAt: number,
    windowDays: number,
    sequence: number,
    weight: number,
    unit: string,
    pinned: boolean,
    attributes: Map<string, string>,
    revision: number,
    status: BatchedQueueAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.sequence = sequence;
    this.weight = weight;
    this.unit = unit;
    this.pinned = pinned;
    this.attributes = attributes;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedQueueAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedQueueAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched queue agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"batched queue agreement"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.revision + this.updatedAt) * 100) / 100;
  }

  copy(): BatchedQueueAgreement {
    return new BatchedQueueAgreement(
      this.code,
      this.name,
      this.cohort,
      this.updatedAt,
      this.windowDays,
      this.sequence,
      this.weight,
      this.unit,
      this.pinned,
      this.attributes,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched queue agreement in status draft. */
export function newBatchedQueueAgreement(code: string, name: string): BatchedQueueAgreement {
  return new BatchedQueueAgreement(code, name, "", 0, 0, 0, 0, "", false, new Map<string, string>(), 0, "draft");
}
