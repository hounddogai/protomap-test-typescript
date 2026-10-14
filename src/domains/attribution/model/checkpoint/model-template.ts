import * as text from "../../../../kit/text.js";

/** Where a model template is in its life cycle. */
export type ModelTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** One model template, with what the planners need to act on it. */
export class ModelTemplate {
  code: string;
  name: string;
  graceDays: number;
  revision: number;
  externalRef: string;
  status: ModelTemplateStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    revision: number,
    externalRef: string,
    status: ModelTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.revision = revision;
    this.externalRef = externalRef;
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

  canMoveTo(next: ModelTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ModelTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"model template"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.graceDays - this.revision) * 100) / 100;
  }

  copy(): ModelTemplate {
    return new ModelTemplate(this.code, this.name, this.graceDays, this.revision, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a model template in status new. */
export function newModelTemplate(code: string, name: string): ModelTemplate {
  return new ModelTemplate(code, name, 0, 0, "", "new");
}
