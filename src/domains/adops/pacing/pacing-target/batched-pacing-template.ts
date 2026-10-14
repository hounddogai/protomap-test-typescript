import * as text from "../../../../kit/text.js";

/** Where a batched pacing template is in its life cycle. */
export type BatchedPacingTemplateStatus = "created" | "validated" | "published" | "retired";

/** A batched pacing template. Its code is unique within a tenant. */
export class BatchedPacingTemplate {
  code: string;
  label: string;
  source: string;
  margin: number;
  tags: string[];
  status: BatchedPacingTemplateStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    margin: number,
    tags: string[],
    status: BatchedPacingTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.margin = margin;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedPacingTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPacingTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched pacing template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched pacing template"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): BatchedPacingTemplate {
    return new BatchedPacingTemplate(this.code, this.label, this.source, this.margin, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched pacing template in status created. */
export function newBatchedPacingTemplate(code: string, label: string): BatchedPacingTemplate {
  return new BatchedPacingTemplate(code, label, "", 0, [], "created");
}
