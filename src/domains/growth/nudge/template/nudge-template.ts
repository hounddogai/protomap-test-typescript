/**
 * The nudge template records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge template is in its life cycle. */
export type NudgeTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** One nudge template, with what the planners need to act on it. */
export class NudgeTemplate {
  code: string;
  name: string;
  campaignRef: string;
  sequence: number;
  graceDays: number;
  status: NudgeTemplateStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    sequence: number,
    graceDays: number,
    status: NudgeTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.sequence = sequence;
    this.graceDays = graceDays;
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

  canMoveTo(next: NudgeTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: NudgeTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round(this.sequence * this.graceDays * 100) / 100;
  }

  copy(): NudgeTemplate {
    return new NudgeTemplate(this.code, this.name, this.campaignRef, this.sequence, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a nudge template in status new. */
export function newNudgeTemplate(code: string, name: string): NudgeTemplate {
  return new NudgeTemplate(code, name, "", 0, 0, "new");
}
