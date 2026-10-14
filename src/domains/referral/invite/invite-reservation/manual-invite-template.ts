import * as text from "../../../../kit/text.js";

/** Where a manual invite template is in its life cycle. */
export type ManualInviteTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a manual invite template and its current status. */
export class ManualInviteTemplate {
  code: string;
  name: string;
  campaignRef: string;
  locale: string;
  endsAt: number;
  country: string;
  label: string;
  status: ManualInviteTemplateStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    locale: string,
    endsAt: number,
    country: string,
    label: string,
    status: ManualInviteTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.endsAt = endsAt;
    this.country = country;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualInviteTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualInviteTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual invite template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"manual invite template"} ${this.code}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): ManualInviteTemplate {
    return new ManualInviteTemplate(
      this.code,
      this.name,
      this.campaignRef,
      this.locale,
      this.endsAt,
      this.country,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual invite template in status new. */
export function newManualInviteTemplate(code: string, name: string): ManualInviteTemplate {
  return new ManualInviteTemplate(code, name, "", "", 0, "", "", "new");
}
