import * as text from "../../../../kit/text.js";

/** Where a adaptive creative quota is in its life cycle. */
export type AdaptiveCreativeQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive creative quota as the creative team keeps it. */
export class AdaptiveCreativeQuota {
  code: string;
  label: string;
  region: string;
  sequence: number;
  updatedAt: number;
  version: number;
  name: string;
  audienceId: string;
  phone: string;
  retries: number;
  status: AdaptiveCreativeQuotaStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    sequence: number,
    updatedAt: number,
    version: number,
    name: string,
    audienceId: string,
    phone: string,
    retries: number,
    status: AdaptiveCreativeQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.sequence = sequence;
    this.updatedAt = updatedAt;
    this.version = version;
    this.name = name;
    this.audienceId = audienceId;
    this.phone = phone;
    this.retries = retries;
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

  canMoveTo(next: AdaptiveCreativeQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: AdaptiveCreativeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive creative quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"adaptive creative quota"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.sequence * this.retries * 100) / 100;
  }

  copy(): AdaptiveCreativeQuota {
    return new AdaptiveCreativeQuota(
      this.code,
      this.label,
      this.region,
      this.sequence,
      this.updatedAt,
      this.version,
      this.name,
      this.audienceId,
      this.phone,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive creative quota in status requested. */
export function newAdaptiveCreativeQuota(code: string, label: string): AdaptiveCreativeQuota {
  return new AdaptiveCreativeQuota(code, label, "", 0, 0, 0, "", "", "", 0, "requested");
}
