import * as text from "../../../../kit/text.js";

/** Where a rolling bid rule audit is in its life cycle. */
export type RollingBidRuleAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One rolling bid rule audit, with what the planners need to act on it. */
export class RollingBidRuleAudit {
  code: string;
  label: string;
  source: string;
  openRate: number;
  revision: number;
  locale: string;
  campaignRef: string;
  priority: number;
  audienceId: string;
  visible: boolean;
  bid: number;
  status: RollingBidRuleAuditStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    openRate: number,
    revision: number,
    locale: string,
    campaignRef: string,
    priority: number,
    audienceId: string,
    visible: boolean,
    bid: number,
    status: RollingBidRuleAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.openRate = openRate;
    this.revision = revision;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.priority = priority;
    this.audienceId = audienceId;
    this.visible = visible;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingBidRuleAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingBidRuleAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling bid rule audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"rolling bid rule audit"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.revision + this.openRate) * 100) / 100;
  }

  copy(): RollingBidRuleAudit {
    return new RollingBidRuleAudit(
      this.code,
      this.label,
      this.source,
      this.openRate,
      this.revision,
      this.locale,
      this.campaignRef,
      this.priority,
      this.audienceId,
      this.visible,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling bid rule audit in status proposed. */
export function newRollingBidRuleAudit(code: string, label: string): RollingBidRuleAudit {
  return new RollingBidRuleAudit(code, label, "", 0, 0, "", "", 0, "", false, 0, "proposed");
}
