import * as text from "../../../../kit/text.js";

/** Where a scheduled macro template is in its life cycle. */
export type ScheduledMacroTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled macro template. Its code is unique within a tenant. */
export class ScheduledMacroTemplate {
  code: string;
  name: string;
  tags: string[];
  title: string;
  journeyId: string;
  frequencyCap: number;
  status: ScheduledMacroTemplateStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    title: string,
    journeyId: string,
    frequencyCap: number,
    status: ScheduledMacroTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.title = title;
    this.journeyId = journeyId;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: ScheduledMacroTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ScheduledMacroTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled macro template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): ScheduledMacroTemplate {
    return new ScheduledMacroTemplate(
      this.code,
      this.name,
      this.tags,
      this.title,
      this.journeyId,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled macro template in status proposed. */
export function newScheduledMacroTemplate(code: string, name: string): ScheduledMacroTemplate {
  return new ScheduledMacroTemplate(code, name, [], "", "", 0, "proposed");
}
