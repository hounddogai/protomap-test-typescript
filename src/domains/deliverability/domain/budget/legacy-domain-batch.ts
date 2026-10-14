import * as text from "../../../../kit/text.js";

/** Where a legacy domain batch is in its life cycle. */
export type LegacyDomainBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy domain batch and its current status. */
export class LegacyDomainBatch {
  code: string;
  name: string;
  retries: number;
  ratio: number;
  limit: number;
  summary: string;
  status: LegacyDomainBatchStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    ratio: number,
    limit: number,
    summary: string,
    status: LegacyDomainBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.ratio = ratio;
    this.limit = limit;
    this.summary = summary;
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

  canMoveTo(next: LegacyDomainBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyDomainBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy domain batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round((this.ratio - this.limit) * 100) / 100;
  }

  copy(): LegacyDomainBatch {
    return new LegacyDomainBatch(this.code, this.name, this.retries, this.ratio, this.limit, this.summary, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy domain batch in status requested. */
export function newLegacyDomainBatch(code: string, name: string): LegacyDomainBatch {
  return new LegacyDomainBatch(code, name, 0, 0, 0, "", "requested");
}
