import * as text from "../../../../kit/text.js";

/** Where a macro template is in its life cycle. */
export type MacroTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One macro template, with what the planners need to act on it. */
export class MacroTemplate {
  code: string;
  label: string;
  journeyId: string;
  sendAt: number;
  graceDays: number;
  description: string;
  audienceId: string;
  startsAt: number;
  revision: number;
  segment: string;
  cost: number;
  status: MacroTemplateStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    sendAt: number,
    graceDays: number,
    description: string,
    audienceId: string,
    startsAt: number,
    revision: number,
    segment: string,
    cost: number,
    status: MacroTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.description = description;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.revision = revision;
    this.segment = segment;
    this.cost = cost;
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

  canMoveTo(next: MacroTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedValue(): number {
    return Math.round(this.sendAt * this.startsAt * 100) / 100;
  }

  copy(): MacroTemplate {
    return new MacroTemplate(
      this.code,
      this.label,
      this.journeyId,
      this.sendAt,
      this.graceDays,
      this.description,
      this.audienceId,
      this.startsAt,
      this.revision,
      this.segment,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a macro template in status open. */
export function newMacroTemplate(code: string, label: string): MacroTemplate {
  return new MacroTemplate(code, label, "", 0, 0, "", "", 0, 0, "", 0, "open");
}
