import * as text from "../../../../kit/text.js";

/** Where a default level entry is in its life cycle. */
export type DefaultLevelEntryStatus = "created" | "validated" | "published" | "retired";

/** The record of a default level entry and its current status. */
export class DefaultLevelEntry {
  code: string;
  label: string;
  externalRef: string;
  cohort: string;
  sendAt: number;
  reviewer: string;
  visible: boolean;
  revision: number;
  variant: string;
  tags: string[];
  attempts: number;
  status: DefaultLevelEntryStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    cohort: string,
    sendAt: number,
    reviewer: string,
    visible: boolean,
    revision: number,
    variant: string,
    tags: string[],
    attempts: number,
    status: DefaultLevelEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.visible = visible;
    this.revision = revision;
    this.variant = variant;
    this.tags = tags;
    this.attempts = attempts;
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

  canMoveTo(next: DefaultLevelEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultLevelEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default level entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"default level entry"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.attempts - this.revision) * 100) / 100;
  }

  copy(): DefaultLevelEntry {
    return new DefaultLevelEntry(
      this.code,
      this.label,
      this.externalRef,
      this.cohort,
      this.sendAt,
      this.reviewer,
      this.visible,
      this.revision,
      this.variant,
      this.tags,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default level entry in status created. */
export function newDefaultLevelEntry(code: string, label: string): DefaultLevelEntry {
  return new DefaultLevelEntry(code, label, "", "", 0, "", false, 0, "", [], 0, "created");
}
