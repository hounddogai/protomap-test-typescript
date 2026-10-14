import * as text from "../../../../kit/text.js";

/** Where a manual preference template is in its life cycle. */
export type ManualPreferenceTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual preference template as the preference team keeps it. */
export class ManualPreferenceTemplate {
  code: string;
  title: string;
  source: string;
  notes: string;
  visible: boolean;
  clicks: number;
  retries: number;
  updatedAt: number;
  limit: number;
  campaignRef: string;
  status: ManualPreferenceTemplateStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    notes: string,
    visible: boolean,
    clicks: number,
    retries: number,
    updatedAt: number,
    limit: number,
    campaignRef: string,
    status: ManualPreferenceTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.notes = notes;
    this.visible = visible;
    this.clicks = clicks;
    this.retries = retries;
    this.updatedAt = updatedAt;
    this.limit = limit;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: ManualPreferenceTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualPreferenceTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual preference template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round((this.retries + this.clicks) * 100) / 100;
  }

  copy(): ManualPreferenceTemplate {
    return new ManualPreferenceTemplate(
      this.code,
      this.title,
      this.source,
      this.notes,
      this.visible,
      this.clicks,
      this.retries,
      this.updatedAt,
      this.limit,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual preference template in status open. */
export function newManualPreferenceTemplate(code: string, title: string): ManualPreferenceTemplate {
  return new ManualPreferenceTemplate(code, title, "", "", false, 0, 0, 0, 0, "", "open");
}
