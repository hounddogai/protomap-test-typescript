import * as text from "../../../../kit/text.js";

/** Where a funnel draft is in its life cycle. */
export type FunnelDraftStatus = "created" | "validated" | "published" | "retired";

/** A funnel draft. Its code is unique within a tenant. */
export class FunnelDraft {
  code: string;
  name: string;
  retries: number;
  batchSize: number;
  threshold: number;
  externalRef: string;
  unit: string;
  channel: string;
  status: FunnelDraftStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    batchSize: number,
    threshold: number,
    externalRef: string,
    unit: string,
    channel: string,
    status: FunnelDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.batchSize = batchSize;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.unit = unit;
    this.channel = channel;
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

  canMoveTo(next: FunnelDraftStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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

  moveTo(next: FunnelDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.retries + this.batchSize) * 100) / 100;
  }

  copy(): FunnelDraft {
    return new FunnelDraft(
      this.code,
      this.name,
      this.retries,
      this.batchSize,
      this.threshold,
      this.externalRef,
      this.unit,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a funnel draft in status created. */
export function newFunnelDraft(code: string, name: string): FunnelDraft {
  return new FunnelDraft(code, name, 0, 0, 0, "", "", "", "created");
}
