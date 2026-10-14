import * as text from "../../../../kit/text.js";

/** Where a capped mention preference is in its life cycle. */
export type CappedMentionPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One capped mention preference, with what the planners need to act on it. */
export class CappedMentionPreference {
  code: string;
  title: string;
  tags: string[];
  source: string;
  checksum: string;
  visible: boolean;
  revision: number;
  status: CappedMentionPreferenceStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    source: string,
    checksum: string,
    visible: boolean,
    revision: number,
    status: CappedMentionPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.source = source;
    this.checksum = checksum;
    this.visible = visible;
    this.revision = revision;
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

  canMoveTo(next: CappedMentionPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedMentionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped mention preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): CappedMentionPreference {
    return new CappedMentionPreference(
      this.code,
      this.title,
      this.tags,
      this.source,
      this.checksum,
      this.visible,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped mention preference in status open. */
export function newCappedMentionPreference(code: string, title: string): CappedMentionPreference {
  return new CappedMentionPreference(code, title, [], "", "", false, 0, "open");
}
