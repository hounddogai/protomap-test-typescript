import * as text from "../../../../kit/text.js";

/** Where a fallback approval milestone is in its life cycle. */
export type FallbackApprovalMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback approval milestone as the approval team keeps it. */
export class FallbackApprovalMilestone {
  code: string;
  label: string;
  threshold: number;
  revision: number;
  version: number;
  visible: boolean;
  limit: number;
  ownerId: string;
  rate: number;
  expiresAt: number;
  locale: string;
  status: FallbackApprovalMilestoneStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    revision: number,
    version: number,
    visible: boolean,
    limit: number,
    ownerId: string,
    rate: number,
    expiresAt: number,
    locale: string,
    status: FallbackApprovalMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.revision = revision;
    this.version = version;
    this.visible = visible;
    this.limit = limit;
    this.ownerId = ownerId;
    this.rate = rate;
    this.expiresAt = expiresAt;
    this.locale = locale;
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

  canMoveTo(next: FallbackApprovalMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackApprovalMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback approval milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"fallback approval milestone"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.threshold + this.expiresAt) * 100) / 100;
  }

  copy(): FallbackApprovalMilestone {
    return new FallbackApprovalMilestone(
      this.code,
      this.label,
      this.threshold,
      this.revision,
      this.version,
      this.visible,
      this.limit,
      this.ownerId,
      this.rate,
      this.expiresAt,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback approval milestone in status open. */
export function newFallbackApprovalMilestone(code: string, label: string): FallbackApprovalMilestone {
  return new FallbackApprovalMilestone(code, label, 0, 0, 0, false, 0, "", 0, 0, "", "open");
}
