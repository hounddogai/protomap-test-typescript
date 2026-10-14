/**
 * The seasonal approval manifest records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal approval manifest is in its life cycle. */
export type SeasonalApprovalManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal approval manifest as the approval team keeps it. */
export class SeasonalApprovalManifest {
  code: string;
  name: string;
  visible: boolean;
  maximum: number;
  revision: number;
  status: SeasonalApprovalManifestStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    maximum: number,
    revision: number,
    status: SeasonalApprovalManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.maximum = maximum;
    this.revision = revision;
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

  canMoveTo(next: SeasonalApprovalManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalApprovalManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal approval manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"seasonal approval manifest"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.revision * this.maximum * 100) / 100;
  }

  copy(): SeasonalApprovalManifest {
    return new SeasonalApprovalManifest(this.code, this.name, this.visible, this.maximum, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal approval manifest in status open. */
export function newSeasonalApprovalManifest(code: string, name: string): SeasonalApprovalManifest {
  return new SeasonalApprovalManifest(code, name, false, 0, 0, "open");
}
