import * as text from "../../../../kit/text.js";

/** Where a csat batch is in its life cycle. */
export type CsatBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** One csat batch, with what the planners need to act on it. */
export class CsatBatch {
  code: string;
  name: string;
  durationMinutes: number;
  timezone: string;
  clicks: number;
  status: CsatBatchStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    timezone: string,
    clicks: number,
    status: CsatBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.timezone = timezone;
    this.clicks = clicks;
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

  canMoveTo(next: CsatBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.durationMinutes - this.clicks) * 100) / 100;
  }

  copy(): CsatBatch {
    return new CsatBatch(this.code, this.name, this.durationMinutes, this.timezone, this.clicks, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a csat batch in status requested. */
export function newCsatBatch(code: string, name: string): CsatBatch {
  return new CsatBatch(code, name, 0, "", 0, "requested");
}
