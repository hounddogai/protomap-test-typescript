import * as text from "../../../../kit/text.js";

/** Where a tiered complaint override is in its life cycle. */
export type TieredComplaintOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a tiered complaint override and its current status. */
export class TieredComplaintOverride {
  code: string;
  name: string;
  checksum: string;
  locale: string;
  conversionRate: number;
  revision: number;
  status: TieredComplaintOverrideStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    locale: string,
    conversionRate: number,
    revision: number,
    status: TieredComplaintOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.revision = revision;
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

  canMoveTo(next: TieredComplaintOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredComplaintOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered complaint override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"tiered complaint override"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.revision + this.conversionRate) * 100) / 100;
  }

  copy(): TieredComplaintOverride {
    return new TieredComplaintOverride(
      this.code,
      this.name,
      this.checksum,
      this.locale,
      this.conversionRate,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered complaint override in status new. */
export function newTieredComplaintOverride(code: string, name: string): TieredComplaintOverride {
  return new TieredComplaintOverride(code, name, "", "", 0, 0, "new");
}
