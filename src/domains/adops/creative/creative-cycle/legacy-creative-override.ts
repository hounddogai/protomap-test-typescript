import * as text from "../../../../kit/text.js";

/** Where a legacy creative override is in its life cycle. */
export type LegacyCreativeOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy creative override. Its code is unique within a tenant. */
export class LegacyCreativeOverride {
  code: string;
  name: string;
  retries: number;
  maximum: number;
  region: string;
  source: string;
  status: LegacyCreativeOverrideStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    maximum: number,
    region: string,
    source: string,
    status: LegacyCreativeOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.maximum = maximum;
    this.region = region;
    this.source = source;
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

  canMoveTo(next: LegacyCreativeOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
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

  moveTo(next: LegacyCreativeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy creative override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy creative override"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.retries + this.maximum) * 100) / 100;
  }

  copy(): LegacyCreativeOverride {
    return new LegacyCreativeOverride(
      this.code,
      this.name,
      this.retries,
      this.maximum,
      this.region,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy creative override in status requested. */
export function newLegacyCreativeOverride(code: string, name: string): LegacyCreativeOverride {
  return new LegacyCreativeOverride(code, name, 0, 0, "", "", "requested");
}
