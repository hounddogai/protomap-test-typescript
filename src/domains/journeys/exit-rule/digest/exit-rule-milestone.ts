import * as text from "../../../../kit/text.js";

/** Where a exit rule milestone is in its life cycle. */
export type ExitRuleMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One exit rule milestone, with what the planners need to act on it. */
export class ExitRuleMilestone {
  code: string;
  label: string;
  visible: boolean;
  source: string;
  tags: string[];
  name: string;
  ownerId: string;
  rate: number;
  status: ExitRuleMilestoneStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    source: string,
    tags: string[],
    name: string,
    ownerId: string,
    rate: number,
    status: ExitRuleMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.source = source;
    this.tags = tags;
    this.name = name;
    this.ownerId = ownerId;
    this.rate = rate;
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

  canMoveTo(next: ExitRuleMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): ExitRuleMilestone {
    return new ExitRuleMilestone(
      this.code,
      this.label,
      this.visible,
      this.source,
      this.tags,
      this.name,
      this.ownerId,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a exit rule milestone in status open. */
export function newExitRuleMilestone(code: string, label: string): ExitRuleMilestone {
  return new ExitRuleMilestone(code, label, false, "", [], "", "", 0, "open");
}
