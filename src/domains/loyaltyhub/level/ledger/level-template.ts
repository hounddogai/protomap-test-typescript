import * as text from "../../../../kit/text.js";

/** Where a level template is in its life cycle. */
export type LevelTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One level template, with what the planners need to act on it. */
export class LevelTemplate {
  code: string;
  name: string;
  minimum: number;
  ceiling: number;
  checksum: string;
  archived: boolean;
  campaignRef: string;
  active: boolean;
  status: LevelTemplateStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    ceiling: number,
    checksum: string,
    archived: boolean,
    campaignRef: string,
    active: boolean,
    status: LevelTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.ceiling = ceiling;
    this.checksum = checksum;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.active = active;
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

  canMoveTo(next: LevelTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.ceiling + this.minimum) * 100) / 100;
  }

  copy(): LevelTemplate {
    return new LevelTemplate(
      this.code,
      this.name,
      this.minimum,
      this.ceiling,
      this.checksum,
      this.archived,
      this.campaignRef,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a level template in status open. */
export function newLevelTemplate(code: string, name: string): LevelTemplate {
  return new LevelTemplate(code, name, 0, 0, "", false, "", false, "open");
}
