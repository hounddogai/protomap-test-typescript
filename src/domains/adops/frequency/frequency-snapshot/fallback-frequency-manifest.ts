import * as text from "../../../../kit/text.js";

/** Where a fallback frequency manifest is in its life cycle. */
export type FallbackFrequencyManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback frequency manifest. Its code is unique within a tenant. */
export class FallbackFrequencyManifest {
  code: string;
  label: string;
  conversionRate: number;
  checksum: string;
  utmSource: string;
  segment: string;
  name: string;
  expiresAt: number;
  visible: boolean;
  reviewer: string;
  status: FallbackFrequencyManifestStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    checksum: string,
    utmSource: string,
    segment: string,
    name: string,
    expiresAt: number,
    visible: boolean,
    reviewer: string,
    status: FallbackFrequencyManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.checksum = checksum;
    this.utmSource = utmSource;
    this.segment = segment;
    this.name = name;
    this.expiresAt = expiresAt;
    this.visible = visible;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackFrequencyManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackFrequencyManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback frequency manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.expiresAt - this.conversionRate) * 100) / 100;
  }

  copy(): FallbackFrequencyManifest {
    return new FallbackFrequencyManifest(
      this.code,
      this.label,
      this.conversionRate,
      this.checksum,
      this.utmSource,
      this.segment,
      this.name,
      this.expiresAt,
      this.visible,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback frequency manifest in status draft. */
export function newFallbackFrequencyManifest(code: string, label: string): FallbackFrequencyManifest {
  return new FallbackFrequencyManifest(code, label, 0, "", "", "", "", 0, false, "", "draft");
}
