import * as text from "../../../../kit/text.js";

/** Where a global mention template is in its life cycle. */
export type GlobalMentionTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global mention template. Its code is unique within a tenant. */
export class GlobalMentionTemplate {
  code: string;
  label: string;
  openRate: number;
  sendAt: number;
  floorValue: number;
  archived: boolean;
  status: GlobalMentionTemplateStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    sendAt: number,
    floorValue: number,
    archived: boolean,
    status: GlobalMentionTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.archived = archived;
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

  canMoveTo(next: GlobalMentionTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalMentionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global mention template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global mention template"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.openRate - this.sendAt) * 100) / 100;
  }

  copy(): GlobalMentionTemplate {
    return new GlobalMentionTemplate(
      this.code,
      this.label,
      this.openRate,
      this.sendAt,
      this.floorValue,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global mention template in status open. */
export function newGlobalMentionTemplate(code: string, label: string): GlobalMentionTemplate {
  return new GlobalMentionTemplate(code, label, 0, 0, 0, false, "open");
}
