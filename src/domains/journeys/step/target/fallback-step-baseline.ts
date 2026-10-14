import * as text from "../../../../kit/text.js";

/** Where a fallback step baseline is in its life cycle. */
export type FallbackStepBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a fallback step baseline and its current status. */
export class FallbackStepBaseline {
  code: string;
  label: string;
  checksum: string;
  attributes: Map<string, string>;
  audienceId: string;
  unit: string;
  startsAt: number;
  openRate: number;
  status: FallbackStepBaselineStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    attributes: Map<string, string>,
    audienceId: string,
    unit: string,
    startsAt: number,
    openRate: number,
    status: FallbackStepBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.attributes = attributes;
    this.audienceId = audienceId;
    this.unit = unit;
    this.startsAt = startsAt;
    this.openRate = openRate;
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

  canMoveTo(next: FallbackStepBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FallbackStepBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback step baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"fallback step baseline"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.startsAt - this.openRate) * 100) / 100;
  }

  copy(): FallbackStepBaseline {
    return new FallbackStepBaseline(
      this.code,
      this.label,
      this.checksum,
      this.attributes,
      this.audienceId,
      this.unit,
      this.startsAt,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback step baseline in status requested. */
export function newFallbackStepBaseline(code: string, label: string): FallbackStepBaseline {
  return new FallbackStepBaseline(code, label, "", new Map<string, string>(), "", "", 0, 0, "requested");
}
