import * as text from "../../../../kit/text.js";

/** Where a tiered double opt in quota is in its life cycle. */
export type TieredDoubleOptInQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered double opt in quota. Its code is unique within a tenant. */
export class TieredDoubleOptInQuota {
  code: string;
  name: string;
  source: string;
  archived: boolean;
  threshold: number;
  retries: number;
  visible: boolean;
  status: TieredDoubleOptInQuotaStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    archived: boolean,
    threshold: number,
    retries: number,
    visible: boolean,
    status: TieredDoubleOptInQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.archived = archived;
    this.threshold = threshold;
    this.retries = retries;
    this.visible = visible;
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

  canMoveTo(next: TieredDoubleOptInQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredDoubleOptInQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered double opt in quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered double opt in quota"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.retries - this.threshold) * 100) / 100;
  }

  copy(): TieredDoubleOptInQuota {
    return new TieredDoubleOptInQuota(
      this.code,
      this.name,
      this.source,
      this.archived,
      this.threshold,
      this.retries,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered double opt in quota in status new. */
export function newTieredDoubleOptInQuota(code: string, name: string): TieredDoubleOptInQuota {
  return new TieredDoubleOptInQuota(code, name, "", false, 0, 0, false, "new");
}
