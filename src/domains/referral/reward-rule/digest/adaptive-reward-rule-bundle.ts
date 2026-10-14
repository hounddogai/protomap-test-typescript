import * as text from "../../../../kit/text.js";

/** Where a adaptive reward rule bundle is in its life cycle. */
export type AdaptiveRewardRuleBundleStatus = "created" | "validated" | "published" | "retired";

/** One adaptive reward rule bundle, with what the planners need to act on it. */
export class AdaptiveRewardRuleBundle {
  code: string;
  label: string;
  phone: string;
  visible: boolean;
  ownerId: string;
  threshold: number;
  cohort: string;
  sendAt: number;
  status: AdaptiveRewardRuleBundleStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    visible: boolean,
    ownerId: string,
    threshold: number,
    cohort: string,
    sendAt: number,
    status: AdaptiveRewardRuleBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.visible = visible;
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveRewardRuleBundleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveRewardRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reward rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"adaptive reward rule bundle"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.sendAt - this.threshold) * 100) / 100;
  }

  copy(): AdaptiveRewardRuleBundle {
    return new AdaptiveRewardRuleBundle(
      this.code,
      this.label,
      this.phone,
      this.visible,
      this.ownerId,
      this.threshold,
      this.cohort,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive reward rule bundle in status created. */
export function newAdaptiveRewardRuleBundle(code: string, label: string): AdaptiveRewardRuleBundle {
  return new AdaptiveRewardRuleBundle(code, label, "", false, "", 0, "", 0, "created");
}
