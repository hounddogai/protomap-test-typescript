import * as text from "../../../../kit/text.js";

/** Where a cohort bundle is in its life cycle. */
export type CohortBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One cohort bundle, with what the planners need to act on it. */
export class CohortBundle {
  code: string;
  label: string;
  visible: boolean;
  notes: string;
  approved: boolean;
  tags: string[];
  attempts: number;
  createdAt: number;
  status: CohortBundleStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    notes: string,
    approved: boolean,
    tags: string[],
    attempts: number,
    createdAt: number,
    status: CohortBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.notes = notes;
    this.approved = approved;
    this.tags = tags;
    this.attempts = attempts;
    this.createdAt = createdAt;
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

  canMoveTo(next: CohortBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"cohort bundle"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round((this.attempts - this.createdAt) * 100) / 100;
  }

  copy(): CohortBundle {
    return new CohortBundle(
      this.code,
      this.label,
      this.visible,
      this.notes,
      this.approved,
      this.tags,
      this.attempts,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a cohort bundle in status planned. */
export function newCohortBundle(code: string, label: string): CohortBundle {
  return new CohortBundle(code, label, false, "", false, [], 0, 0, "planned");
}
