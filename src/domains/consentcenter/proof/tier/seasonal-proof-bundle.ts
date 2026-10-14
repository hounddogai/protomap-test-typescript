import * as text from "../../../../kit/text.js";

/** Where a seasonal proof bundle is in its life cycle. */
export type SeasonalProofBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal proof bundle, with what the planners need to act on it. */
export class SeasonalProofBundle {
  code: string;
  label: string;
  country: string;
  visible: boolean;
  checksum: string;
  category: string;
  floorValue: number;
  channel: string;
  revision: number;
  segment: string;
  status: SeasonalProofBundleStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    visible: boolean,
    checksum: string,
    category: string,
    floorValue: number,
    channel: string,
    revision: number,
    segment: string,
    status: SeasonalProofBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.visible = visible;
    this.checksum = checksum;
    this.category = category;
    this.floorValue = floorValue;
    this.channel = channel;
    this.revision = revision;
    this.segment = segment;
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

  canMoveTo(next: SeasonalProofBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalProofBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal proof bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.floorValue + this.revision) * 100) / 100;
  }

  copy(): SeasonalProofBundle {
    return new SeasonalProofBundle(
      this.code,
      this.label,
      this.country,
      this.visible,
      this.checksum,
      this.category,
      this.floorValue,
      this.channel,
      this.revision,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal proof bundle in status draft. */
export function newSeasonalProofBundle(code: string, label: string): SeasonalProofBundle {
  return new SeasonalProofBundle(code, label, "", false, "", "", 0, "", 0, "", "draft");
}
