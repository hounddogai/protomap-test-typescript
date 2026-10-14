import * as text from "../../../../kit/text.js";

/** Where a strict reward rule manifest is in its life cycle. */
export type StrictRewardRuleManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict reward rule manifest as the reward rule team keeps it. */
export class StrictRewardRuleManifest {
  code: string;
  label: string;
  approved: boolean;
  version: number;
  floorValue: number;
  externalRef: string;
  ratio: number;
  status: StrictRewardRuleManifestStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    version: number,
    floorValue: number,
    externalRef: string,
    ratio: number,
    status: StrictRewardRuleManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.version = version;
    this.floorValue = floorValue;
    this.externalRef = externalRef;
    this.ratio = ratio;
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

  canMoveTo(next: StrictRewardRuleManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: StrictRewardRuleManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward rule manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.version + this.floorValue) * 100) / 100;
  }

  copy(): StrictRewardRuleManifest {
    return new StrictRewardRuleManifest(
      this.code,
      this.label,
      this.approved,
      this.version,
      this.floorValue,
      this.externalRef,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict reward rule manifest in status idle. */
export function newStrictRewardRuleManifest(code: string, label: string): StrictRewardRuleManifest {
  return new StrictRewardRuleManifest(code, label, false, 0, 0, "", 0, "idle");
}
