import * as text from "../../../../kit/text.js";

/** Where a regional suppression manifest is in its life cycle. */
export type RegionalSuppressionManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional suppression manifest. Its code is unique within a tenant. */
export class RegionalSuppressionManifest {
  code: string;
  label: string;
  sequence: number;
  campaignRef: string;
  source: string;
  weight: number;
  visible: boolean;
  status: RegionalSuppressionManifestStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    campaignRef: string,
    source: string,
    weight: number,
    visible: boolean,
    status: RegionalSuppressionManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.campaignRef = campaignRef;
    this.source = source;
    this.weight = weight;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalSuppressionManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSuppressionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional suppression manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round((this.weight + this.sequence) * 100) / 100;
  }

  copy(): RegionalSuppressionManifest {
    return new RegionalSuppressionManifest(
      this.code,
      this.label,
      this.sequence,
      this.campaignRef,
      this.source,
      this.weight,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional suppression manifest in status idle. */
export function newRegionalSuppressionManifest(code: string, label: string): RegionalSuppressionManifest {
  return new RegionalSuppressionManifest(code, label, 0, "", "", 0, false, "idle");
}
