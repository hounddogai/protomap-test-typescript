import * as text from "../../../../kit/text.js";

/** Where a regional sender batch is in its life cycle. */
export type RegionalSenderBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional sender batch. Its code is unique within a tenant. */
export class RegionalSenderBatch {
  code: string;
  label: string;
  journeyId: string;
  tags: string[];
  description: string;
  limit: number;
  status: RegionalSenderBatchStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    tags: string[],
    description: string,
    limit: number,
    status: RegionalSenderBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.tags = tags;
    this.description = description;
    this.limit = limit;
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

  canMoveTo(next: RegionalSenderBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalSenderBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sender batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional sender batch"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): RegionalSenderBatch {
    return new RegionalSenderBatch(
      this.code,
      this.label,
      this.journeyId,
      this.tags,
      this.description,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional sender batch in status new. */
export function newRegionalSenderBatch(code: string, label: string): RegionalSenderBatch {
  return new RegionalSenderBatch(code, label, "", [], "", 0, "new");
}
