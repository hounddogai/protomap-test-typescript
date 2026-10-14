import * as text from "../../../../kit/text.js";

/** Where a approval notice is in its life cycle. */
export type ApprovalNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A approval notice as the approval team keeps it. */
export class ApprovalNotice {
  code: string;
  label: string;
  threshold: number;
  campaignRef: string;
  source: string;
  tags: string[];
  active: boolean;
  status: ApprovalNoticeStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    campaignRef: string,
    source: string,
    tags: string[],
    active: boolean,
    status: ApprovalNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.source = source;
    this.tags = tags;
    this.active = active;
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

  canMoveTo(next: ApprovalNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ApprovalNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): ApprovalNotice {
    return new ApprovalNotice(
      this.code,
      this.label,
      this.threshold,
      this.campaignRef,
      this.source,
      this.tags,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a approval notice in status idle. */
export function newApprovalNotice(code: string, label: string): ApprovalNotice {
  return new ApprovalNotice(code, label, 0, "", "", [], false, "idle");
}
