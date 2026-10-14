import * as text from "../../../../kit/text.js";

/** Where a lenient retention draft is in its life cycle. */
export type LenientRetentionDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient retention draft as the retention team keeps it. */
export class LenientRetentionDraft {
  code: string;
  label: string;
  visible: boolean;
  segment: string;
  notes: string;
  createdAt: number;
  tags: string[];
  status: LenientRetentionDraftStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    segment: string,
    notes: string,
    createdAt: number,
    tags: string[],
    status: LenientRetentionDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.segment = segment;
    this.notes = notes;
    this.createdAt = createdAt;
    this.tags = tags;
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

  canMoveTo(next: LenientRetentionDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientRetentionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient retention draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
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
    return this.createdAt;
  }

  copy(): LenientRetentionDraft {
    return new LenientRetentionDraft(
      this.code,
      this.label,
      this.visible,
      this.segment,
      this.notes,
      this.createdAt,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient retention draft in status open. */
export function newLenientRetentionDraft(code: string, label: string): LenientRetentionDraft {
  return new LenientRetentionDraft(code, label, false, "", "", 0, [], "open");
}
