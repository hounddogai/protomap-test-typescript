import * as text from "../../../../kit/text.js";

/** Where a legacy funnel draft is in its life cycle. */
export type LegacyFunnelDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy funnel draft as the funnel team keeps it. */
export class LegacyFunnelDraft {
  code: string;
  label: string;
  limit: number;
  threshold: number;
  channel: string;
  timezone: string;
  status: LegacyFunnelDraftStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    threshold: number,
    channel: string,
    timezone: string,
    status: LegacyFunnelDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.threshold = threshold;
    this.channel = channel;
    this.timezone = timezone;
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

  canMoveTo(next: LegacyFunnelDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
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

  moveTo(next: LegacyFunnelDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy funnel draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round((this.threshold - this.limit) * 100) / 100;
  }

  copy(): LegacyFunnelDraft {
    return new LegacyFunnelDraft(
      this.code,
      this.label,
      this.limit,
      this.threshold,
      this.channel,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy funnel draft in status draft. */
export function newLegacyFunnelDraft(code: string, label: string): LegacyFunnelDraft {
  return new LegacyFunnelDraft(code, label, 0, 0, "", "", "draft");
}
