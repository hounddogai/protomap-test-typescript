import * as text from "../../../../kit/text.js";

/** Where a mention override is in its life cycle. */
export type MentionOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** One mention override, with what the planners need to act on it. */
export class MentionOverride {
  code: string;
  title: string;
  variant: string;
  cohort: string;
  description: string;
  minimum: number;
  label: string;
  status: MentionOverrideStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    cohort: string,
    description: string,
    minimum: number,
    label: string,
    status: MentionOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.cohort = cohort;
    this.description = description;
    this.minimum = minimum;
    this.label = label;
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

  canMoveTo(next: MentionOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"mention override"} ${this.code}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): MentionOverride {
    return new MentionOverride(
      this.code,
      this.title,
      this.variant,
      this.cohort,
      this.description,
      this.minimum,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a mention override in status new. */
export function newMentionOverride(code: string, title: string): MentionOverride {
  return new MentionOverride(code, title, "", "", "", 0, "", "new");
}
