import * as text from "../../../../kit/text.js";

/** Where a pending nudge template is in its life cycle. */
export type PendingNudgeTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pending nudge template, with what the planners need to act on it. */
export class PendingNudgeTemplate {
  code: string;
  title: string;
  audienceId: string;
  impressions: number;
  locale: string;
  openRate: number;
  description: string;
  status: PendingNudgeTemplateStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    impressions: number,
    locale: string,
    openRate: number,
    description: string,
    status: PendingNudgeTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.locale = locale;
    this.openRate = openRate;
    this.description = description;
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

  canMoveTo(next: PendingNudgeTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingNudgeTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending nudge template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round(this.openRate * this.impressions * 100) / 100;
  }

  copy(): PendingNudgeTemplate {
    return new PendingNudgeTemplate(
      this.code,
      this.title,
      this.audienceId,
      this.impressions,
      this.locale,
      this.openRate,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending nudge template in status proposed. */
export function newPendingNudgeTemplate(code: string, title: string): PendingNudgeTemplate {
  return new PendingNudgeTemplate(code, title, "", 0, "", 0, "", "proposed");
}
