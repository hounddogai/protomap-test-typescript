import * as text from "../../../../kit/text.js";

/** Where a capped model batch is in its life cycle. */
export type CappedModelBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a capped model batch and its current status. */
export class CappedModelBatch {
  code: string;
  name: string;
  currency: string;
  ratio: number;
  approved: boolean;
  threshold: number;
  expiresAt: number;
  tags: string[];
  status: CappedModelBatchStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    ratio: number,
    approved: boolean,
    threshold: number,
    expiresAt: number,
    tags: string[],
    status: CappedModelBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.ratio = ratio;
    this.approved = approved;
    this.threshold = threshold;
    this.expiresAt = expiresAt;
    this.tags = tags;
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

  canMoveTo(next: CappedModelBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "closed";
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

  moveTo(next: CappedModelBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped model batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.ratio + this.threshold) * 100) / 100;
  }

  copy(): CappedModelBatch {
    return new CappedModelBatch(
      this.code,
      this.name,
      this.currency,
      this.ratio,
      this.approved,
      this.threshold,
      this.expiresAt,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped model batch in status draft. */
export function newCappedModelBatch(code: string, name: string): CappedModelBatch {
  return new CappedModelBatch(code, name, "", 0, false, 0, 0, [], "draft");
}
