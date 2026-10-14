import * as text from "../../../../kit/text.js";

/** Where a legacy pacing mapping is in its life cycle. */
export type LegacyPacingMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy pacing mapping as the pacing team keeps it. */
export class LegacyPacingMapping {
  code: string;
  title: string;
  conversionRate: number;
  variant: string;
  endsAt: number;
  campaignRef: string;
  sequence: number;
  channel: string;
  externalRef: string;
  country: string;
  status: LegacyPacingMappingStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    variant: string,
    endsAt: number,
    campaignRef: string,
    sequence: number,
    channel: string,
    externalRef: string,
    country: string,
    status: LegacyPacingMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.variant = variant;
    this.endsAt = endsAt;
    this.campaignRef = campaignRef;
    this.sequence = sequence;
    this.channel = channel;
    this.externalRef = externalRef;
    this.country = country;
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

  canMoveTo(next: LegacyPacingMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: LegacyPacingMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy pacing mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy pacing mapping"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.sequence + this.conversionRate) * 100) / 100;
  }

  copy(): LegacyPacingMapping {
    return new LegacyPacingMapping(
      this.code,
      this.title,
      this.conversionRate,
      this.variant,
      this.endsAt,
      this.campaignRef,
      this.sequence,
      this.channel,
      this.externalRef,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy pacing mapping in status requested. */
export function newLegacyPacingMapping(code: string, title: string): LegacyPacingMapping {
  return new LegacyPacingMapping(code, title, 0, "", 0, "", 0, "", "", "", "requested");
}
