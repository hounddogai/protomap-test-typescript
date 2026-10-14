import * as text from "../../../../kit/text.js";

/** Where a tiered path mapping is in its life cycle. */
export type TieredPathMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered path mapping. Its code is unique within a tenant. */
export class TieredPathMapping {
  code: string;
  label: string;
  version: number;
  graceDays: number;
  name: string;
  sequence: number;
  locale: string;
  ceiling: number;
  timezone: string;
  endsAt: number;
  description: string;
  status: TieredPathMappingStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    graceDays: number,
    name: string,
    sequence: number,
    locale: string,
    ceiling: number,
    timezone: string,
    endsAt: number,
    description: string,
    status: TieredPathMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.graceDays = graceDays;
    this.name = name;
    this.sequence = sequence;
    this.locale = locale;
    this.ceiling = ceiling;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.description = description;
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

  canMoveTo(next: TieredPathMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPathMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered path mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.version - this.sequence) * 100) / 100;
  }

  copy(): TieredPathMapping {
    return new TieredPathMapping(
      this.code,
      this.label,
      this.version,
      this.graceDays,
      this.name,
      this.sequence,
      this.locale,
      this.ceiling,
      this.timezone,
      this.endsAt,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered path mapping in status requested. */
export function newTieredPathMapping(code: string, label: string): TieredPathMapping {
  return new TieredPathMapping(code, label, 0, 0, "", 0, "", 0, "", 0, "", "requested");
}
