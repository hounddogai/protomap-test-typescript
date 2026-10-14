import * as text from "../../../../kit/text.js";

/** Where a lenient warmup template is in its life cycle. */
export type LenientWarmupTemplateStatus = "created" | "validated" | "published" | "retired";

/** The record of a lenient warmup template and its current status. */
export class LenientWarmupTemplate {
  code: string;
  label: string;
  archived: boolean;
  windowDays: number;
  title: string;
  status: LenientWarmupTemplateStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    windowDays: number,
    title: string,
    status: LenientWarmupTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.windowDays = windowDays;
    this.title = title;
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

  canMoveTo(next: LenientWarmupTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientWarmupTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient warmup template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): LenientWarmupTemplate {
    return new LenientWarmupTemplate(this.code, this.label, this.archived, this.windowDays, this.title, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient warmup template in status created. */
export function newLenientWarmupTemplate(code: string, label: string): LenientWarmupTemplate {
  return new LenientWarmupTemplate(code, label, false, 0, "", "created");
}
