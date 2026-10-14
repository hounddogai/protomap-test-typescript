import * as text from "../../../../kit/text.js";

/** Where a adaptive frequency manifest is in its life cycle. */
export type AdaptiveFrequencyManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a adaptive frequency manifest and its current status. */
export class AdaptiveFrequencyManifest {
  code: string;
  label: string;
  approved: boolean;
  threshold: number;
  maximum: number;
  createdAt: number;
  status: AdaptiveFrequencyManifestStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    threshold: number,
    maximum: number,
    createdAt: number,
    status: AdaptiveFrequencyManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.threshold = threshold;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveFrequencyManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveFrequencyManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive frequency manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"adaptive frequency manifest"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.createdAt - this.maximum) * 100) / 100;
  }

  copy(): AdaptiveFrequencyManifest {
    return new AdaptiveFrequencyManifest(
      this.code,
      this.label,
      this.approved,
      this.threshold,
      this.maximum,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive frequency manifest in status open. */
export function newAdaptiveFrequencyManifest(code: string, label: string): AdaptiveFrequencyManifest {
  return new AdaptiveFrequencyManifest(code, label, false, 0, 0, 0, "open");
}
