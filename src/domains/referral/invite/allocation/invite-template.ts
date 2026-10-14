import * as text from "../../../../kit/text.js";

/** Where a invite template is in its life cycle. */
export type InviteTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a invite template and its current status. */
export class InviteTemplate {
  code: string;
  label: string;
  locale: string;
  endsAt: number;
  tags: string[];
  unit: string;
  status: InviteTemplateStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    endsAt: number,
    tags: string[],
    unit: string,
    status: InviteTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.endsAt = endsAt;
    this.tags = tags;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: InviteTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): InviteTemplate {
    return new InviteTemplate(this.code, this.label, this.locale, this.endsAt, this.tags, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a invite template in status planned. */
export function newInviteTemplate(code: string, label: string): InviteTemplate {
  return new InviteTemplate(code, label, "", 0, [], "", "planned");
}
