import * as text from "../../../../kit/text.js";

/** Where a deflection quota is in its life cycle. */
export type DeflectionQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A deflection quota. Its code is unique within a tenant. */
export class DeflectionQuota {
  code: string;
  title: string;
  openRate: number;
  source: string;
  amount: number;
  externalRef: string;
  active: boolean;
  ratio: number;
  timezone: string;
  status: DeflectionQuotaStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    source: string,
    amount: number,
    externalRef: string,
    active: boolean,
    ratio: number,
    timezone: string,
    status: DeflectionQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.source = source;
    this.amount = amount;
    this.externalRef = externalRef;
    this.active = active;
    this.ratio = ratio;
    this.timezone = timezone;
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

  canMoveTo(next: DeflectionQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
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

  moveTo(next: DeflectionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"deflection quota"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.amount * this.ratio * 100) / 100;
  }

  copy(): DeflectionQuota {
    return new DeflectionQuota(
      this.code,
      this.title,
      this.openRate,
      this.source,
      this.amount,
      this.externalRef,
      this.active,
      this.ratio,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a deflection quota in status new. */
export function newDeflectionQuota(code: string, title: string): DeflectionQuota {
  return new DeflectionQuota(code, title, 0, "", 0, "", false, 0, "", "new");
}
