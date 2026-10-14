import * as text from "../../../../kit/text.js";

/** Where a pending pacing template is in its life cycle. */
export type PendingPacingTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a pending pacing template and its current status. */
export class PendingPacingTemplate {
  code: string;
  title: string;
  category: string;
  source: string;
  version: number;
  checksum: string;
  limit: number;
  summary: string;
  budget: number;
  status: PendingPacingTemplateStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    source: string,
    version: number,
    checksum: string,
    limit: number,
    summary: string,
    budget: number,
    status: PendingPacingTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.source = source;
    this.version = version;
    this.checksum = checksum;
    this.limit = limit;
    this.summary = summary;
    this.budget = budget;
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

  canMoveTo(next: PendingPacingTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
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

  moveTo(next: PendingPacingTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending pacing template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round(this.version * this.budget * 100) / 100;
  }

  copy(): PendingPacingTemplate {
    return new PendingPacingTemplate(
      this.code,
      this.title,
      this.category,
      this.source,
      this.version,
      this.checksum,
      this.limit,
      this.summary,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending pacing template in status new. */
export function newPendingPacingTemplate(code: string, title: string): PendingPacingTemplate {
  return new PendingPacingTemplate(code, title, "", "", 0, "", 0, "", 0, "new");
}
