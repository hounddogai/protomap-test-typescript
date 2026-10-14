import * as text from "../../../../kit/text.js";

/** Where a strict fraud check template is in its life cycle. */
export type StrictFraudCheckTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict fraud check template, with what the planners need to act on it. */
export class StrictFraudCheckTemplate {
  code: string;
  title: string;
  visible: boolean;
  journeyId: string;
  region: string;
  channel: string;
  reviewer: string;
  summary: string;
  revision: number;
  archived: boolean;
  status: StrictFraudCheckTemplateStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    journeyId: string,
    region: string,
    channel: string,
    reviewer: string,
    summary: string,
    revision: number,
    archived: boolean,
    status: StrictFraudCheckTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.journeyId = journeyId;
    this.region = region;
    this.channel = channel;
    this.reviewer = reviewer;
    this.summary = summary;
    this.revision = revision;
    this.archived = archived;
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

  canMoveTo(next: StrictFraudCheckTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictFraudCheckTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict fraud check template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"strict fraud check template"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): StrictFraudCheckTemplate {
    return new StrictFraudCheckTemplate(
      this.code,
      this.title,
      this.visible,
      this.journeyId,
      this.region,
      this.channel,
      this.reviewer,
      this.summary,
      this.revision,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict fraud check template in status new. */
export function newStrictFraudCheckTemplate(code: string, title: string): StrictFraudCheckTemplate {
  return new StrictFraudCheckTemplate(code, title, false, "", "", "", "", "", 0, false, "new");
}
