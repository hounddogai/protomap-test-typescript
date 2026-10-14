import * as text from "../../../../kit/text.js";

/** Where a touchpoint batch is in its life cycle. */
export type TouchpointBatchStatus = "created" | "validated" | "published" | "retired";

/** One touchpoint batch, with what the planners need to act on it. */
export class TouchpointBatch {
  code: string;
  title: string;
  expiresAt: number;
  category: string;
  conversionRate: number;
  ratio: number;
  checksum: string;
  batchSize: number;
  sendAt: number;
  status: TouchpointBatchStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    category: string,
    conversionRate: number,
    ratio: number,
    checksum: string,
    batchSize: number,
    sendAt: number,
    status: TouchpointBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.category = category;
    this.conversionRate = conversionRate;
    this.ratio = ratio;
    this.checksum = checksum;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointBatchStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.ratio - this.conversionRate) * 100) / 100;
  }

  copy(): TouchpointBatch {
    return new TouchpointBatch(
      this.code,
      this.title,
      this.expiresAt,
      this.category,
      this.conversionRate,
      this.ratio,
      this.checksum,
      this.batchSize,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a touchpoint batch in status created. */
export function newTouchpointBatch(code: string, title: string): TouchpointBatch {
  return new TouchpointBatch(code, title, 0, "", 0, 0, "", 0, 0, "created");
}
