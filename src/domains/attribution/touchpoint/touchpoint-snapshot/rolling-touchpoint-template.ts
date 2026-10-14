import * as text from "../../../../kit/text.js";

/** Where a rolling touchpoint template is in its life cycle. */
export type RollingTouchpointTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One rolling touchpoint template, with what the planners need to act on it. */
export class RollingTouchpointTemplate {
  code: string;
  title: string;
  summary: string;
  cohort: string;
  reviewer: string;
  durationMinutes: number;
  label: string;
  status: RollingTouchpointTemplateStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    cohort: string,
    reviewer: string,
    durationMinutes: number,
    label: string,
    status: RollingTouchpointTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.cohort = cohort;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.label = label;
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

  canMoveTo(next: RollingTouchpointTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingTouchpointTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling touchpoint template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): RollingTouchpointTemplate {
    return new RollingTouchpointTemplate(
      this.code,
      this.title,
      this.summary,
      this.cohort,
      this.reviewer,
      this.durationMinutes,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling touchpoint template in status idle. */
export function newRollingTouchpointTemplate(code: string, title: string): RollingTouchpointTemplate {
  return new RollingTouchpointTemplate(code, title, "", "", "", 0, "", "idle");
}
